import Vue from 'vue'
import Vuex from 'vuex'
import firebase from '@firebase/app'
import '@firebase/firestore'
import uuid from 'uuid/v4'

/*
 * Firebase Configuration
 */

firebase.initializeApp({
  apiKey: "???",
  authDomain: "ichi-ban.firebaseapp.com",
  databaseURL: "https://ichi-ban.firebaseio.com",
  storageBucket: "ichi-ban.appspot.com",
  messagingSenderId: "???",
  projectId: "ichi-ban",
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
  stages: [
    {
      name: 'Soon',
      topics: [
      ]
    },
    {
      name: 'In Progress',
      topics: [
      ]
    },
    {
      name: 'Paused',
      topics: []
    },
    {
      name: 'Done',
      topics: []
    },
    {
      name: 'Someday',
      topics: [
      ]
    },
    {
      name: 'Handed Off',
      topics: []
    },
    {
      name: 'Blocked',
      topics: []
    },
    {
      name: 'Canceled',
      topics: []
    }
  ]
}

const actions = {
  addTopicToStage (context, { topic, stage_name }) {
    context.commit('addTopicToStage', { topic, stage_name })
    // Save to Firebase
    firebase.database()
      .ref('stages')
      .set(context.state.stages)
  },
  deleteTopicFromStageByIndex (context, { stage, topic_index }) {
    stage.topics.splice(topic_index, 1)
    // Save to Firebase
    firebase.database()
      .ref('stages')
      .set(context.state.stages)
  },
  saveStagesToFirebase (context) {
    firebase.database()
      .ref('stages')
      .set(context.state.stages)
  },
  loadFromFirebase (context) {
    // Load all data from Firebase
    firebase.database()
      .ref('stages')
      .on('value', (snapshot) => {
        let newStages = snapshot.val()
        if (newStages === null) {
          // TODO init data
          return
        }
        _.merge(context.state.stages, newStages)
        // HACK
        context.state.data_ready = true
      })
  }
}

const mutations = {
  addTopicToStage (context, { topic, stage_name }) {
    // Update, don't create new, if topic.id exists
    if (!topic.id) {
      topic.id = uuid()
      // Even though we loop over all stages, a topic can only be in 1 stage
      context.stages.forEach((stage) => {
        if (stage.name === stage_name) {
          stage.topics.unshift(topic)
        }
      })
    } else {
      // TODO do nothing?
    }
  }
}

export default new Vuex.Store({
  state,
  actions,
  mutations
})
