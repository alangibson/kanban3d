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
    topic: clone(TOPIC)
  },
  show_stage_popup: {
    visible: false,
    stage: clone(STAGE)
  },
  user: null,
  projects: [],
  project: null,
  events: [
  ]
}

const actions = {
  setAuthenticatedUser (context, { user }) {
    context.commit('setAuthenticatedUser', user);
    context.dispatch('listenToFirestore');
  },
  addTopicToStage (context, { topic, stage_name }) {
    context.commit('addTopicToStage', { topic, stage_name });
    context.dispatch('saveToFirestore');
    // TODO need stageIndex
    // context.dispatch('addEvent', {
    //   type: 'TOPIC_CREATED',
    //   topicId: topic.id,
    //   fromStageIndex: null,
    //   toStageIndex: event.to.dataset.stageIndex,
    //   createdAt: new Date()
    // });
  },
  deleteTopicFromStageByIndex (context, { stage, topic_index }) {
    stage.topics.splice(topic_index, 1);
    context.dispatch('saveToFirestore');
  },
  setTopicsInStage (context, {topics, stage_index}) {
    context.commit('setTopicsInStage', {topics, stage_index});
    
    // TODO add event
    // context.dispatch('addEvent', {event_type: 'TOPIC_MOVED', topic: })
    
    context.dispatch('saveToFirestore');
  },
  selectProjectById (context, project_id) {
    // db.collection('projects')
    //   .doc(project_id)
    //   .get()
    //   .then(projectSnapshot => {
    //     let project = projectSnapshot.data();
    //     project.id = projectSnapshot.id;
    //     this.commit('setProject', project);
    //   });
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
        {
          name: "Soon",
          topics: []
        },
        {
          name: "In Progress",
          topics: []
        },
        {
          name: "Paused",
          topics: []
        },
        {
          name: "Done",
          topics: []
        },
        {
          name: "Someday",
          topics: []
        },
        {
          name: "Handed Off",
          topics: []
        },
        {
          name: "Blocked",
          topics: []
        },
        {
          name: "Canceled",
          topics: []
        }
      ]
    };
    
    db.collection('projects')
      .add(project)
      .then(projectRef => {
        // Set current project to projectRef
        project.id = projectRef.id;
        context.commit('setProject', project);
      });
  },
  addEvent (context, { type, topicId, fromStageIndex, toStageIndex, createdAt }) {
    // TODO save stage names
    db.collection('projects')
      .doc(context.state.project.id)
      .collection('events')
      .add({
        type,
        topicId,
        fromStageIndex,
        toStageIndex,
        createdAt
      });
  },
  saveToFirestore (context) {
    db.collection('projects')
      .doc(context.state.project.id)
      .set(context.state.project);
  },
  loadFromFirebase (context) {
    console.log('loadFromFirebase');

    let projectId = 'rsLQGIzVT80h4Z1VNA70';
    context.dispatch('selectProjectById', projectId);
  
    // Set list of project names
    db.collection('projects')
      .where('owner_id', '==', context.state.user.uid)
      .then(querySnapshot => {
        let projects = [];
        querySnapshot.forEach(project => {
          projects.push({
            id: project.id,
            name: project.get('name')
          });
        });
        context.commit('setProjects', projects);
      });
    
  },
  listenToFirestore (context, projectId) {
    console.log('listenToFirestore', projectId);
    // Listen for changes
    
    // let projectId = 'rsLQGIzVT80h4Z1VNA70';
    if (!projectId) {
      // projectId = 'EPptkQiqlVkKQRmn74HQ';
      projectId = 'rsLQGIzVT80h4Z1VNA70';
    }
    
    // Set active project
    db.collection('projects')
      .doc(projectId)
      .onSnapshot(projectSnapshot => {
        let project = projectSnapshot.data();
        project.id = projectSnapshot.id;
    //
    //     let stages = project.stages;
    //     project.stages = [];
    //     stages.forEach(stageRef => {
    //
    //       db.doc('/projects/' + projectId + '/' + stageRef.path)
    //         .get()
    //         .then(r => {
    //           let stage = r.data();
    //           stage.id = r.id;
    //           project.stages.push(stage);
    //         })
    //
    //       // TODO Why doesnt this work?
    //       // project.stages[0]
    //       //   .get()
    //       //   .then(stageSnapshot => {
    //       //     console.log(stageSnapshot.data());
    //       //   });
    //
    //     });
        this.commit('setProject', project);
      });
  
    // Set list of project names
    db.collection('projects')
      .where('owner_id', '==', context.state.user.uid)
      .onSnapshot(querySnapshot => {
        let projects = [];
        querySnapshot.forEach(project => {
          projects.push({
            id: project.id,
            name: project.get('name')
          });
        });
        context.commit('setProjects', projects);
      });
  }
};

const mutations = {
  setAuthenticatedUser (state, user) {
    state.user = user;
  },
  setProject (state, project) {
    state.project = project;
  },
  setProjects (state, projects) {
    state.projects = projects;
  },
  addTopicToStage (context, { topic, stage_name }) {
    // Update, don't create new, if topic.id exists
    if (!topic.id) {
      topic.id = uuid();
      // Even though we loop over all stages, a topic can only be in 1 stage
      context.project.stages.forEach((stage) => {
        if (stage.name === stage_name) {
          stage.topics.unshift(topic);
        }
      })
    } else {
      // TODO do nothing?
    }
  },
  setStages (state, stages) {
    console.log('setStages', JSON.stringify(stages));
    state.project.stages = stages;
  },
  setTopicsInStage (state, {topics, stage_index}) {
    console.log('setTopicsInStage', state.project.stages[stage_index].topics);
    state.project.stages[stage_index].topics = topics;
  },
  //
  // Topic popups
  //
  showAddTopicPopup (state, stage) {
    state.add_topic_popup.topic = clone(TOPIC);
    if (stage) {
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
  mutations
})
