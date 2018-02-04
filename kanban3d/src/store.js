import Vue from 'vue'
import Vuex from 'vuex'
import firebase from '@firebase/app'
import '@firebase/auth'
import '@firebase/database'

// // Initialize Firebase
// var config = {
//     apiKey: "AIzaSyDtMhmkNw3dAFX9J1DV3kYUf8SEnjt-MkQ",
//     authDomain: "kanban3d.firebaseapp.com",
//     databaseURL: "https://kanban3d.firebaseio.com",
//     projectId: "kanban3d",
//     storageBucket: "kanban3d.appspot.com",
//     messagingSenderId: "101979808277"
// }
// firebase.initializeApp(config)

Vue.use(Vuex)

let store = new Vuex.Store({
  state: {
    drawer: false
  },
  mutations: {
  },
  actions: {
  }
})

// firebase.database()
//   .ref('topics')
//   .on('value', function(snapshot) {
//     let newTopics = snapshot.val()
//     if (newTopics===null) {
//       newTopics = []
//     }
//     console.log('newTopics', newTopics)
//     store.commit('setTopics', newTopics)
//   })

export default store
