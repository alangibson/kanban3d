import Vue from 'vue'
import Vuex from 'vuex'
import firebase from '@firebase/app'
import '@firebase/firestore'
import uuid from 'uuid/v4'

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
    context.dispatch('addEvent', {
      type: 'TOPIC_CREATED',
      topicId: event.item.dataset.topicId,
      fromStageIndex: null,
      toStageIndex: event.to.dataset.stageIndex,
      createdAt: new Date()
    });
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
    db.collection('projects')
      .doc(project_id)
      .get()
      .then(projectSnapshot => {
        let project = projectSnapshot.data();
        project.id = projectSnapshot.id;
        this.commit('setProject', project);
      });
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
  listenToFirestore (context) {
    // Listen for changes
    let projectId = 'rsLQGIzVT80h4Z1VNA70';
    db.collection('projects')
      .doc(projectId)
      .onSnapshot(projectSnapshot => {
        let project = projectSnapshot.data();
        project.id = projectSnapshot.id;
        this.commit('setProject', project);
      });
    
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
  }
};

export default new Vuex.Store({
  state,
  actions,
  mutations
})
