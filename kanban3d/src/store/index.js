import _ from 'lodash'
import Vue from 'vue'
import Vuex from 'vuex'
import firebase from '@firebase/app'
import '@firebase/firestore'
import uuid from 'uuid/v4'
import { clone, STAGE, TOPIC } from '@/common';

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
})

// Initialize Cloud Firestore through Firebase
var db = firebase.firestore()

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
    console.log('getters project', state.projects[state.activeProjectId]);
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
    console.log('addTopicToStageById', topic, topic.id, stage_id);
    
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
                console.log('topic deleted', topicId);
              })
              .catch((error) => {
                console.error('Failed to delete topic', topicId, error);;
              });
          });
      });
  },
  setTopicsInStage (context, {topics, stage}) {
    console.log('setTopicsInStage', stage.id, context.getters.project.id, topics, context.state.topics[topics[0].id]);

    // TODO add event
    // context.dispatch('addEvent', {event_type: 'TOPIC_MOVED', topic: })
    
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
  },
  selectProjectById (context, project_id) {
    context.commit('setActiveProjectId', project_id);
    context.dispatch('listenToFirestore', project_id);
  },
  newProject (context, { project_name }) {
    let user = firebase.auth().currentUser;
    if (!user) {
      console.error('Cant create new project. Not logged in!');
      return;
    }
    let project = {
      name: project_name,
      owner_id: user.uid,
      version: 1,
      stages: [
      ]
    };
    // Save new project and make it our active project
    db.collection('projects')
      .add(project)
      .then(projectRef => {
        context.dispatch('selectProjectById', projectRef.id);
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
  listenToFirestore (context, projectId) {
    // Listen for changes
    console.log('listenToFirestore', projectId);

    // TODO get projects list and select first project
    if (!projectId) {
      projectId = 'EPptkQiqlVkKQRmn74HQ';
      // projectId = 'rsLQGIzVT80h4Z1VNA70';
    }
    
    // Listen for Projects
    db.collection('projects')
      .where('owner_id', '==', context.state.user.uid)
      .onSnapshot(querySnapshot => {
        console.log('New projects collection snapshot');
        let projects = {};
        querySnapshot.forEach(projectSnapshot => {
          let project = projectSnapshot.data();
          project.id = projectSnapshot.id;
          projects[projectSnapshot.id] = project;
        });
        context.commit('setProjects', projects);
      });
    
    // Listen for Topics
    db.collection('projects')
      .doc(projectId)
      .collection('topics')
      .onSnapshot(topicsSnapshot => {
        console.log('New topics collection snapshot');
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
      .doc(projectId)
      .collection('stages')
      .onSnapshot(stagesSnapshot => {
        console.log('New stages collection snapshot');
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

    context.commit('setActiveProjectId', projectId);
  }
};

const mutations = {
  setAuthenticatedUser (state, user) {
    state.user = user;
  },
  setActiveProjectId (state, projectId) {
    console.log('setActiveProjectId', projectId);
    state.activeProjectId = projectId;
  },
  setProjects (state, projects) {
    console.log('setprojects', projects);
    state.projects = projects;
  },
  setStages (state, stages) {
    console.log('setStages was', state.stages);
    console.log('setStages will be', stages);
    state.stages = stages;
  },
  setTopicsInStage (state, {topics, stage}) {
    console.log('setTopicsInStage', topics, stage);
    state.stages[stage.id].topics = topics;
  },
  setTopics (state, topics) {
    state.topics = topics;
  },
  //
  // Topic popups
  //
  showAddTopicPopup (state, stage) {
    console.log('showAddTopicPopup', stage.id);
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
