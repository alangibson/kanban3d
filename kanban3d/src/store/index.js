import Vue from 'vue'
import Vuex from 'vuex'
import firebase from '@firebase/app'
import '@firebase/database'

// Initialize Firebase
var config = {
  apiKey: "AIzaSyDtMhmkNw3dAFX9J1DV3kYUf8SEnjt-MkQ",
  authDomain: "kanban3d.firebaseapp.com",
  databaseURL: "https://kanban3d.firebaseio.com",
  projectId: "kanban3d",
  storageBucket: "kanban3d.appspot.com",
  messagingSenderId: "101979808277"
}
firebase.initializeApp(config)

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
    // Even though we loop over all stages, a topic can only be in 1 stage
    context.stages.forEach((stage) => {
      if (stage.name === stage_name) {
        stage.topics.unshift(topic)
      }
    })
  }
}

export default new Vuex.Store({
  state,
  actions,
  mutations
})
