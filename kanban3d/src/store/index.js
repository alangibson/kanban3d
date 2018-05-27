import _ from 'lodash'
import Vue from 'vue'
import Vuex from 'vuex'
import firebase from '@firebase/app'
import '@firebase/firestore'
import uuid from 'uuid/v4'
import { clone, STAGE, TOPIC, PROJECT } from '@/common';

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

/*
 * Vue Configuration
 */

Vue.use(Vuex)

const state = {
  drawer: false,
  data_ready: false,
  show: {
    in_sight: true,
    out_of_mind: true,
    row_state: 11
  },
  add_topic_popup: {
    visible: false,
    stage: {},
    stage_name: null,
    topic: clone(TOPIC)
  },
  edit_topic_popup: {
    visible: false,
    stage: {},
    topic: clone(TOPIC)
  },
  show_stage_popup: {
    visible: false,
    stage: clone(STAGE)
  },
  project_popup: {
    visible: false,
    project: clone(PROJECT)
  },
  user: null,
  activeProjectId: null,
  projects: {},
  stages: {},
  topics: {},
  events: []
};

const getters = {
  project (state) {
    if (! state.projects[state.activeProjectId]) {
      return;
    }
    let project = {};
    _.assign(project, state.projects[state.activeProjectId]);
    project.stages = state.projects[state.activeProjectId].stages
      .map(stageRef => {
        let stage = {};
        if (! state.stages[stageRef.id]) {
          return;
        }
        _.assign(stage, state.stages[stageRef.id]);
        stage.topics = state.stages[stageRef.id].topics
          .map(topicRef => state.topics[topicRef.id]);
        return stage;
      });
    return project;
  }
};

const actions = {
  setAuthenticatedUser (context, { user }) {
    context.commit('setAuthenticatedUser', user);
    context.dispatch('listenToFirestore');
  },
  saveTopicToStageById (context, { topic, stage_id }) {
    // Updating existing topic or create new topic
    if (context.state.topics[topic.id]) {
      // Topic already exists. Just need to update
      db.collection('projects')
        .doc(context.getters.project.id)
        .collection('topics')
        .doc(topic.id)
        .update(topic);
    } else {
      // Topic doesnt exist. Need to add.
      db.collection('projects')
        .doc(context.getters.project.id)
        .collection('topics')
        .add(topic)
        .then(topicRef => {
      
          // Find stage in stages collection by id, then add topic ref to topics array
          // Dont update local data structure!
          console.log('stage_id', stage_id);
          db.collection('projects')
            .doc(context.getters.project.id)
            .collection('stages')
            .doc(stage_id)
            .get()
            .then(stageSnapshot => {
          
              let stage = stageSnapshot.data();
              stage.topics.unshift(topicRef);
              db.collection('projects')
                .doc(context.getters.project.id)
                .collection('stages')
                .doc(stage_id)
                .update(stage);
          
            });
        });
    }
    
    // TODO create event
    // context.dispatch('addEvent', {
    //   type: 'TOPIC_CREATED',
    //   topicId: topic.id,
    //   fromStageIndex: null,
    //   toStageIndex: event.to.dataset.stageIndex,
    //   createdAt: new Date()
    // });
  },
  deleteTopicFromStageByIndex (context, { stage, topic_index }) {
    let topicId = stage.topics[topic_index].id;
    // Delete entry from stage.topics
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
  setTopicsInStage (context, {topics, stage}) {
    // Note: topics can be empty array

    // Update local state
    context.commit('setTopicsInStage', {topics, stage});
    
    // Update Firestore
    let topicRefs = topics.map(topic => db.doc(topic.ref.path));
    db.collection('projects')
      .doc(context.getters.project.id)
      .collection('stages')
      .doc(stage.id)
      .get()
      .then(stageSnapshot => {
        let newStage = stageSnapshot.data();
        newStage.topics = topicRefs;
        db.collection('projects')
          .doc(context.getters.project.id)
          .collection('stages')
          .doc(stage.id)
          .update(newStage);
      });

    // TODO add event
    // context.dispatch('addEvent', {event_type: 'TOPIC_MOVED', topic: })
  },
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
    let origStages = clone(project.stages);
    project.stages = [];
    // Save new project to Firestore
    db.collection('projects')
      .add(project)
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
  addEvent (context, { type, topicId, fromStageIndex, toStageIndex, createdAt }) {
    // TODO save stage names
    db.collection('projects')
      .doc(context.getters.project.id)
      .collection('events')
      .add({
        type,
        topicId,
        fromStageIndex,
        toStageIndex,
        createdAt
      });
  },
  listenToFirestore (context) {
    // Listen for changes
    
    // Listen for Projects
    // Start listening for stages and topics once we have loaded projects
    db.collection('projects')
      .where('owner_id', '==', context.state.user.uid)
      .onSnapshot(querySnapshot => {
        
        // Load up all projects
        let projects = {};
        querySnapshot.forEach(projectSnapshot => {
          let project = projectSnapshot.data();
          project.id = projectSnapshot.id;
          projects[projectSnapshot.id] = project;
        });
        context.commit('setProjects', projects);
  
        // Set default project if needed
        // Do this here because the is the earliest point where we know which projects are available.
        if (! context.state.activeProjectId) {
          context.commit('setActiveProjectId', querySnapshot.docs[0].id);
        }
  
        // Listen for Topics
        db.collection('projects')
          .doc(context.state.activeProjectId)
          .collection('topics')
          .onSnapshot(topicsSnapshot => {
            let topics = context.state.topics;
            topicsSnapshot.forEach(topicSnapshot => {
              let topic = topicSnapshot.data();
              topic.id = topicSnapshot.id;
              topic.ref = { path: topicSnapshot.ref.path };
              topics[topicSnapshot.id] = topic;
            });
            context.commit('setTopics', topics);
          });
  
        // Listen for Stages
        db.collection('projects')
          .doc(context.state.activeProjectId)
          .collection('stages')
          .onSnapshot(stagesSnapshot => {
            let stages = {};
            stagesSnapshot.forEach(stageSnapshot => {
              let data = stageSnapshot.data();
              // HACK do we need to unpack data() like this?
              stages[stageSnapshot.id] = {
                id: stageSnapshot.id,
                name: data.name,
                topics: data.topics
                  .map(topicRef => ( {id: topicRef.id, path: topicRef.path, ref: topicRef} ))
              };
            });
            context.commit('setStages', stages);
          });
      });
  }
};

const mutations = {
  setAuthenticatedUser (state, user) {
    state.user = user;
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
    state.add_topic_popup.topic = clone(TOPIC);
    if (stage) {
      state.add_topic_popup.stage = stage;
      state.add_topic_popup.stage_name = stage.name;
    }
    state.add_topic_popup.visible = true;
  },
  showEditTopicPopup (state, topic) {
    state.edit_topic_popup.topic = topic;
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

export default new Vuex.Store({
  state,
  actions,
  mutations,
  getters
})
