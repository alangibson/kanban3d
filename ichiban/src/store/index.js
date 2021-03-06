import _ from 'lodash';
import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate'
import firebase from '@firebase/app';
import '@firebase/firestore';
import { clone, safeJSONStringify } from '@/common';
import { Project, Stage, Topic, TopicRef, Event, ProjectsMap, StagesMap, TopicsMap, EventsCollection, defaultStages } from '@/models';
import demoProjectGenerator from '@/models/demo';
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
var unsubscribeEvents = () => {};

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
    // Build Project->Stage->Topic heirarchy by resolving id references
    project.stages = project.stages
      .map(stageRef => {
        // Create a Stage object
        if (! state.stages[stageRef.id]) {
          return;
        }
        // Clone object since we will modify it
        let stage = Object.assign(new Stage(), state.stages[stageRef.id]);
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
   * Start the application after user logs in
   */
  startUp (context) {
    console.log('Starting up app');
    firebase.auth()
      .onAuthStateChanged(user => {
        console.log('Firestore auth state changed', user);
        if (user) {
          context.dispatch('auth/handleAuthStateChanged', user, {root: true})
            .then(() => {
              // See if we have any projects
              db.collection('projects')
                .where('owner_id', '==', user.uid)
                .onSnapshot(snapshot => {
                  console.log('snapshot', snapshot);
                  if (snapshot.empty) {
                    // Do nothing so that demo project stays visible
                    context.dispatch('listenToFirestore');
                  } else {
                    // We have projects, so start listening
                    context.dispatch('listenToFirestore');
                  }
                });
            });
        } else {
          // User signed out
          context.dispatch('auth/handleAuthStateChanged', user, {root: true})
            .then(() => {
              context.dispatch('shutDown');
            });
        }
      });
  },
  /**
   * Stop the application after user logs out.
   * @param context
   */
  shutDown (context) {
    console.log('Shutting down app');
    // context.dispatch('unsubscribeFromFirestore')
    //   .then(() => {
    //     context.dispatch('auth/setAuthenticatedUser', null, { root: true });
    //   });
    context.dispatch('unsubscribeFromFirestore');
  },
  /**
   * Reset local state
   */
  reset (context) {
    context.commit('reset');
  },
  saveTopicToStage (context, { topic, stage }) {

    // We need a real Firestore ref for the TopicsMetric object
    let stageRef = db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(stage.ref.id);

    // Updating existing topic or create new topic
    if (context.state.topics.hasTopic(topic.id)) {
      // Topic already exists, just update.
      // Note: Does not set stage

      // Call moved metric
      topic.metrics.move(stageRef);

      // TODO need catch block
      // TODO why does topic disappear when topic.toFirestoreDoc throws error?
      // Topic already exists in some stage. Just need to update.
      db.collection('projects')
        .doc(context.getters.project.id)
        .collection('topics')
        .doc(topic.id)
        .update(topic.toFirestoreDoc(db))
        .then(() => {
          // TODO We should support moving to different Stage when updating
        })
        .catch(error => {
          console.error(error);
        });
      
    } else {
      // Topic doesn't exist in stage. Need to add.

      // Call created metric
      topic.metrics.create(stageRef);

      // Get Project ref for Firestore
      let projectRef = db
        .collection('projects')
        .doc(context.getters.project.id);
      
      // Add Topic to Project, then add Topic to Stage
      projectRef
        .collection('topics')
        .add(topic.toFirestoreDoc(db))
        .then(topicRef => {
          // Need this to create event below
          topic.id = topicRef.id;
          // Find stage in stages collection by id, then add topic ref to topics array
          // Dont update local data structure!
          stage.topics.unshift(new TopicRef(topicRef.id, topicRef.path).toFirestoreDoc(db));
          projectRef
            .collection('stages')
            .doc(stage.id)
            .update(stage.toFirestoreDoc(db))
            .then(() => {
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
    // Do write in a batch/transaction
    let batch = db.batch();

    // Update from stage
    let fromRef = db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(fromStageId);
    batch.update(fromRef, context.state.stages[fromStageId].toFirestoreDoc(db));

    // Update to stage
    let toStageRef = db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(toStageId);
    batch.update(toStageRef, context.state.stages[toStageId].toFirestoreDoc(db));

    // Update metrics
    context.state.topics[topicId].metrics.move(toStageRef);
    // TODO call a mutator with commit
    let topicRef = db.collection('projects')
      .doc(context.getters.project.id)
      .collection('topics')
      .doc(topicId);
    batch.update(topicRef, context.state.topics[topicId].toFirestoreDoc(db));

    batch.commit();
  },

  deleteTopicFromStage (context, { stage, topicRef, topic_index }) {

    // let topicId = stage.topics[topic_index].id;
    let topicId = topicRef.id;

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
  setTopicRefsInStageByStageRef (context, { topicRefs, stageRef }) {

    // Update local state
    // Causes glitch where topic jumps to previous stage when Firestore updates
    context.commit('setTopicRefsInStageByStageRef', { topicRefs, stageRef });

    // Turn TopicRef objects into real Firestore DocumentReferences
    let newStage = context.state.stages[stageRef.id].toFirestoreDoc(db);
    newStage.topics = topicRefs
      .map(topic => db.doc(topic.path));
    
    db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(stageRef.id)
      .update(newStage);
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
  /**
   * Create a new, empty project.
   * @param context
   * @param project Project object
   * @param stages StagesMap object
   */
  newProject (context, { project, stages }) {
    let user = firebase.auth().currentUser;
    if (!user) {
      console.error('Cant create new project. Not logged in!');
      return;
    }
    project.owner_id = user.uid;
    // Make sure we have a collection of Stages
    if (! stages) {
      stages = defaultStages();
    }

    project.stages = [];
    // Save new project to Firestore
    db.collection('projects')
      .add(project.toFirestoreDoc(db))
      .then(projectRef => {

        // TODO save topics, if any

        // Start saving all new stages
        let stagePromises = [];
        stages.forEach(stage => {
          stagePromises.push(
            projectRef.collection('stages')
              .add(stage.toFirestoreDoc(db))
          );
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

    console.log('topic', event.topic);

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

  /**
   * Listen to changes in Firestore
   */
  listenToFirestore (context) {

    console.log('Listening for changes to Firestore');

    let user = firebase.auth().currentUser;
    if (!user) {
      console.warn('Cant listen to Firestore when there is no authenticated user');
      return;
    }
    // if (! context.state.auth.user) {
    //   return;
    // }

    // Listen for Projects
    // Start listening for stages and topics once we have loaded projects
    // TODO getting lots of 'uncaught exception' errors when deleting project
    unsubscribeProjects = db.collection('projects')
      // .where('owner_id', '==', context.state.auth.user.uid)
      .where('owner_id', '==', user.uid)
      .onSnapshot(projectsSnapshot => {
        // Load up all projects
        let projects = ProjectsMap.fromSnapshot(projectsSnapshot);
        context.commit('setProjects', projects);

        // Set default project if needed
        // Do this here because the is the earliest point where we know which projects are available.
        // HACK shouldnt need to hard code demo project key here
        if (! context.state.activeProjectId || context.state.activeProjectId === 'demo-project') {
          context.commit('setActiveProjectId', projects.getDefaultProjectId());
        }
  
        // Listen for Topics
        unsubscribeTopics = db.collection('projects')
          .doc(context.state.activeProjectId)
          .collection('topics')
          .onSnapshot(topicsSnapshot => {
            // Load up all Topics
            context.commit('setTopics', TopicsMap.fromSnapshot(topicsSnapshot));
          });
  
        // Listen for Stages
        unsubscribeStages = db.collection('projects')
          .doc(context.state.activeProjectId)
          .collection('stages')
          .onSnapshot(stagesSnapshot => {
            // Load up all Stages
            context.commit('setStages', StagesMap.fromSnapshot(stagesSnapshot));
          });

        // Listen for Events
        // TODO query for subset of events
        unsubscribeEvents = db.collection('projects')
          .doc(context.state.activeProjectId)
          .collection('events')
          .onSnapshot(eventsSnapshot => {
            context.commit('setEvents', EventsCollection.fromSnapshot(eventsSnapshot));
          });

      });
  },
  unsubscribeFromFirestore (context) {
    unsubscribeProjects();
    unsubscribeTopics();
    unsubscribeStages();
    unsubscribeEvents();
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
  setTopicRefsInStageByStageRef (state, { topicRefs, stageRef }) {
    state.stages[stageRef.id].topics = topicRefs;
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
  },
  //
  // Events
  //
  setEvents (state, events) {
    state.events = events;
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
