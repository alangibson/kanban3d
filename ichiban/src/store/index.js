import _ from 'lodash';
import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate'
import firebase from '@firebase/app';
import '@firebase/firestore';
import { clone, safeJSONStringify } from '@/common';
import { Project, Stage, Topic, TopicRef, Event, ProjectsMap, StagesMap, TopicsMap, EventsCollection, DEFAULT_STAGES } from '@/models';
import auth from '@/store/Auth';

// firebase.firestore.setLogLevel('debug');

/*
 * Firebase Configuration
 */

firebase.initializeApp({
  apiKey: "AIzaSyAdtdFx-0xXgTeVOB9rEMTxrq7ScZOKN7g",
  authDomain: "ichi-ban.firebaseapp.com",
  databaseURL: "https://ichi-ban.firebaseio.com",
  projectId: "ichi-ban",
  storageBucket: "ichi-ban.appspot.com",
  messagingSenderId: "951945396453"
});

// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();
// These functions are provided by listenToFirestore()
// Functions are initialized to avoid needless errors
var unsubscribeProjects = () => {};
var unsubscribeTopics = () => {};
var unsubscribeStages = () => {};

/*
 * Vue Configuration
 */

Vue.use(Vuex);

const state = {
  // Show side menu?
  drawer: false,
  data_ready: false,
  show: {
    in_sight: true,
    out_of_mind: true,
    past: true,
    present: true,
    future: true,
    row_state: 11
  },
  add_topic_popup: {
    visible: false,
    stage: null,
    topic: new Topic(),
    popup_type: 'add'
  },
  edit_topic_popup: {
    visible: false,
    stage: null,
    topic: new Topic(),
    popup_type: 'edit'
  },
  show_stage_popup: {
    visible: false,
    stage: new Stage()
  },
  project_popup: {
    visible: false,
    project: new Project()
  },
  activeProjectId: null,
  projects: new ProjectsMap(),
  stages: new StagesMap(),
  topics: new TopicsMap(),
  events: new EventsCollection()
};

const getters = {
  /**
   * Gets current active project.
   * Rebuilds Project->Stage->Topic hierarchy from flattened Firestore/Vuex structure.
   * Resolves refs in Project.stages and Stage.topics to real Stage and Topic objects.
   */
  project (state) {
    // See if there is a project with id of activeProjectId
    if (! state.projects.hasProject(state.activeProjectId)) {
      console.log('Could not find active project with id ', state.activeProjectId);
      return;
    }
    
    // Create a cloned Project object
    // Clone object since we will modify it
    let project = Object.assign(new Project(), state.projects[state.activeProjectId]);
    // let project = state.projects[state.activeProjectId];
    
    // Build Project->Stage->Topic heirarchy by resolving id references
    project.stages = project.stages
      .map(stageRef => {
        
        // Create a Stage object
        if (! state.stages[stageRef.id]) {
          return;
        }
        // Clone object since we will modify it
        let stage = Object.assign(new Stage(), state.stages[stageRef.id]);
        // let stage = state.stages[stageRef.id];
        
        // Fill out Topics in stage
        stage.topics = stage.topics
          .map(topicRef => state.topics[topicRef.id]);
        
        return stage;
      });
    
    return project;
  }
};

const actions = {
  /**
   * Reset local state
   */
  reset (context) {
    context.commit('reset');
  },
  saveTopicToStage (context, { topic, stage }) {
    
    // Updating existing topic or create new topic
    if (context.state.topics.hasTopic(topic.id)) {
      // Topic already exists, just update.
      // Note: Does not set stage
      
      // TODO need catch block
      // TODO why does topic disappear when topic.toFirestoreDoc throws error?
      // Topic already exists in some stage. Just need to update.
      db.collection('projects')
        .doc(context.getters.project.id)
        .collection('topics')
        .doc(topic.id)
        .update(topic.toFirestoreDoc())
        .then(() => {
          // TODO We should support moving to different Stage when updating
        })
        .catch(error => {
          console.error(error);
        });
      
    } else {
      // Topic doesn't exist in stage. Need to add.
      
      // Get Project ref for Firestore
      let projectRef = db
        .collection('projects')
        .doc(context.getters.project.id);
      
      // Add Topic to Project, then add Topic to Stage
      projectRef
        .collection('topics')
        .add(topic.toFirestoreDoc())
        .then(topicRef => {
          // Need this to create event below
          topic.id = topicRef.id;
          // Find stage in stages collection by id, then add topic ref to topics array
          // Dont update local data structure!
          stage.topics.unshift(new TopicRef(topicRef.id, topicRef.path).toFirestoreDoc());
          projectRef
            .collection('stages')
            .doc(stage.id)
            .update(stage.toFirestoreDoc())
            .then(() => {
              // Create event
              context.dispatch('addEvent',
                new Event({
                  type: 'TOPIC_CREATED',
                  topic: topic,
                  stage: stage
                })
              );
            })
            .catch(error => {
              console.error(error);
            });
        })
        .catch(error => {
          console.error(error);
        });
    }
  },
  moveTopicById (context, { topicId, fromStageId, toStageId }) {
    // console.log('moveTopicById ', topicId, fromStageId, toStageId);
    // context.commit('moveTopicById', { topicId, fromStageId, toStageId });

    // Do write in a batch/transaction
    let batch = db.batch();

    // Update from stage
    let fromRef = db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(fromStageId);
    batch.update(fromRef, context.state.stages[fromStageId].toFirestoreDoc());

    // Update to stage
    let toRef = db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(toStageId);
    batch.update(toRef, context.state.stages[toStageId].toFirestoreDoc());

    batch.commit();
  },
  deleteTopicFromStage (context, { stage, topic, topic_index }) {

    // let topicId = stage.topics[topic_index].id;
    let topicId = topic.id;

    // Delete entry from stage.topics
    // TODO execute these in a batch
    db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(stage.id)
      .get()
      .then(stageSnapshot => {
        // Remove the topic from stage's array
        let newStage = stageSnapshot.data();
        newStage.topics.splice(topic_index, 1);
        // Save newly changed stage
        db.collection('projects')
          .doc(context.getters.project.id)
          .collection('stages')
          .doc(stage.id)
          .update(newStage)
          .then(() => {
            // Delete Topic from topics collection
            db.collection('projects')
              .doc(context.getters.project.id)
              .collection('topics')
              .doc(topicId)
              .delete()
              .then(() => {
              })
              .catch((error) => {
                console.error('Failed to delete topic', topicId, error);;
              });
          });
      });
  },
  /**
   * Replace list of Topics in Stage with new list of Topics.
   * @param context
   * @param topics Array of topic refs. Can be empty array.
   * @param stage Stage to save Topics list to
   */
  setTopicsInStage (context, { topics, stage }) {

    // Update local state
    // Causes glitch where topic jumps to previous stage when Firestore updates
    context.commit('setTopicsInStage', { topics, stage });

    // Turn TopicRef objects into real Firestore DocumentReferences
    let newStage = stage.toFirestoreDoc();
    newStage.topics = topics
      .map(topic => db.doc(topic.path));
    
    db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(stage.id)
      .update(newStage);
    
    // TODO add event
    // context.dispatch('addEvent', {event_type: 'TOPIC_MOVED', topic: })
  },
  /**
   * Set active poject and start listening to Firestore.
   * @param context
   * @param project_id
   */
  selectProjectById (context, project_id) {
    context.commit('setActiveProjectId', project_id);
    context.dispatch('listenToFirestore');
  },
  newProject (context, project) {
    let user = firebase.auth().currentUser;
    if (!user) {
      console.error('Cant create new project. Not logged in!');
      return;
    }
    project.owner_id = user.uid;
    // let origStages = clone(project.stages);
    let origStages = clone(DEFAULT_STAGES);
    project.stages = [];
    // Save new project to Firestore
    db.collection('projects')
      .add(project.toFirestoreDoc())
      .then(projectRef => {
        // Start saving all new stages
        let stagePromises = [];
        origStages.forEach(origStage => {
          stagePromises.push(
            projectRef.collection('stages').add(origStage));
        });
        // Wait for all stages to be saved, then add them to project.stages array
        Promise.all(stagePromises)
          .then(stageRefs => {
            projectRef
              .get()
              .then(projectSnapshot => {
                let p = projectSnapshot.data();
                p.stages = stageRefs;
                projectRef.update(p);
                // Were done, so set this project to active
                context.dispatch('selectProjectById', projectRef.id);
              });
          });
        
      });
  },
  deleteProject (context, project) {
    db.collection('projects')
      .doc(project.id)
      .delete()
      .then(() => {
        // Select default project
        // TODO will get error if no default (ie no projects)
        context.dispatch('selectProjectById', context.state.projects.getDefaultProject().id);
      })
      .catch((error) => {
        console.error('Failed to delete project', project, error);;
      });
  },
  addEvent (context, event) {
    let topicRef = db
      .collection('projects')
      .doc(context.getters.project.id)
      .collection('topics')
      .doc(event.topic.id);
    let stageRef = db
      .collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(event.stage.id);
    db.collection('projects')
      .doc(context.getters.project.id)
      .collection('events')
      .add({
        type: event.type,
        topic: topicRef,
        stage: stageRef,
        createdAt: event.createdAt
      });
  },
  
  //
  // Menus, visibility
  //
  
  showAddTopicPopup (context, stage) {
    if (! context.getters.project) {
      return;
    }
    // Default to first Stage
    if (! stage) {
      stage = context.getters.project.stages[0];
    }
    context.commit('showAddTopicPopup', stage);
  },
  
  //
  // Firestore
  //
  
  listenToFirestore (context) {
    // Listen for changes
    
    // Listen for Projects
    // Start listening for stages and topics once we have loaded projects
    // TODO getting lots of 'uncaught exception' errors when deleting project
    unsubscribeProjects = db.collection('projects')
      .where('owner_id', '==', context.state.auth.user.uid)
      .onSnapshot(projectsSnapshot => {
        // Load up all projects
        context.commit('setProjects', ProjectsMap.fromSnapshot(projectsSnapshot));
  
        // Set default project if needed
        // Do this here because the is the earliest point where we know which projects are available.
        if (! context.state.activeProjectId) {
          context.commit('setActiveProjectId', projectsSnapshot.docs[0].id);
        }
  
        // Listen for Topics
        unsubscribeTopics = db.collection('projects')
          .doc(context.state.activeProjectId)
          .collection('topics')
          .onSnapshot(topicsSnapshot => {
            // Load up all Topics
            // debugger;
            context.commit('setTopics', TopicsMap.fromSnapshot(topicsSnapshot));
          });
  
        // Listen for Stages
        unsubscribeStages = db.collection('projects')
          .doc(context.state.activeProjectId)
          .collection('stages')
          .onSnapshot(stagesSnapshot => {
            // Load up all Stages
            // debugger;
            context.commit('setStages', StagesMap.fromSnapshot(stagesSnapshot));
          });
      });
  },
  unsubscribeFromFirestore (context) {
    unsubscribeProjects();
    unsubscribeTopics();
    unsubscribeStages();
  }
};

const mutations = {
  /**
   * Reset state to initial state
   */
  reset (state) {
    state.projects = new ProjectsMap();
    state.topics = new TopicsMap();
    state.stages = new StagesMap();
    state.events = new EventsCollection();
    state.activeProjectId = null;
    state.drawer = false;
  },
  showDrawer (state, showDrawer) {
    state.drawer = showDrawer;
  },
  setActiveProjectId (state, projectId) {
    state.activeProjectId = projectId;
  },
  setProjects (state, projects) {
    state.projects = projects;
  },
  setStages (state, stages) {
    state.stages = stages;
  },
  setTopicsInStage (state, {topics, stage}) {
    state.stages[stage.id].topics = topics;
  },
  setTopics (state, topics) {
    state.topics = topics;
  },
  moveTopicById (state, { topicId, fromStageId, toStageId }) {
    // state.stages[fromStageId].topics = state.stages[fromStageId].topics
    //   .filter(topicRef => topicRef.id === topicId);
    // state.stages[toStageId].topics
  },
  //
  // Project popup
  //
  showNewProjectPopup (state) {
    state.project_popup.visible = true;
  },
  //
  // Topic popups
  //
  showAddTopicPopup (state, stage) {
    state.add_topic_popup.topic = new Topic();
    state.add_topic_popup.stage = stage;
    state.add_topic_popup.visible = true;
  },
  showEditTopicPopup (state, { topic, stage }) {
    console.log('showEditTopicPopup', topic.name, stage.name);
    state.edit_topic_popup.topic = topic;
    state.edit_topic_popup.stage = stage;
    state.edit_topic_popup.visible = true;
  },
  //
  // Stage popup
  //
  showStagePopup (state, stage) {
    state.show_stage_popup.stage = stage;
    state.show_stage_popup.visible = true;
  }
};

const modules = {
  auth
};

export default new Vuex.Store({
  plugins: [
    createPersistedState({
      paths: [
        'activeProjectId',
        'show',
        'drawer'
      ]
    })
  ],
  modules,
  state,
  actions,
  mutations,
  getters
})
