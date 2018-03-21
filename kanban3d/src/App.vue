<template>
  <v-app>

    <v-navigation-drawer
        app
        fixed
        v-model="$store.state.drawer">
      <v-list dense>

        <v-list-tile v-if="!is_logged_in" @click="logIn">
          <v-list-tile-action>
            <v-icon>lock_outline</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Log In</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile v-if="is_logged_in" @click="logOut">
          <v-list-tile-action>
            <v-icon>lock_open</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Log Out</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>Projects</v-list-tile-title>
            <v-list-tile-sub-title v-for="project in projects">
              <a @click.prevent="loadProject(project.id)">
                {{project.name}}
              </a>
            </v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>Selected: {{project.name}}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>

        <v-list-tile>
          <v-list-tile-title>Visibility</v-list-tile-title>
        </v-list-tile>
        <v-list-tile>
          <v-checkbox label="In Sight"
                      @change="calculateRowState"
                      v-model="$store.state.show.in_sight"/>
        </v-list-tile>
        <v-list-tile>
          <v-checkbox label="Out of Mind"
                      @change="calculateRowState"
                      v-model="$store.state.show.out_of_mind"/>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>

    <v-content>
      <v-container fluid fill-height grid-list-md>

        <router-view :activeProject="project"/>

        <v-dialog
            persistent
            max-width="290"
            v-model="showLogInOverlay">
          <v-card>
            <v-card-title>
              <span class="headline">Welcome To Kanban3D</span>
            </v-card-title>
            <v-card-text>
              You need to log in to use Kanban3D.
              <v-btn @click="logIn">Log In</v-btn>
            </v-card-text>
          </v-card>
        </v-dialog>

      </v-container>
    </v-content>

  </v-app>
</template>

<script>
import Vue from 'vue'
import firebase from '@firebase/app'
import '@firebase/auth'
import '@firebase/firestore'

// Initialize Firebase
let config = {
  apiKey: "AIzaSyDtMhmkNw3dAFX9J1DV3kYUf8SEnjt-MkQ",
  authDomain: "kanban3d.firebaseapp.com",
  databaseURL: "https://kanban3d.firebaseio.com",
  projectId: "kanban3d",
  storageBucket: "kanban3d.appspot.com",
  messagingSenderId: "101979808277"
};
firebase.initializeApp(config);
let db = firebase.firestore();

export default {
  computed: {
    showLogInOverlay() {
      return !this.is_logged_in
    }
  },
  data: () => ({
    drawer: false,
    is_logged_in: false,
    projects: [],
    // Currently selected project
    project: { id: null, name: null }
  }),
  methods: {
    logIn () {
      // Create an authentication provider
      var provider = new firebase.auth.GoogleAuthProvider();
      // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

      firebase.auth().signInWithPopup(provider).then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;

        // TODO document.getElementById('quickstart-oauthtoken').textContent = token;
        console.log('quickstart-oauthtoken', token)

        this.is_logged_in = true
      })
      .catch((error) => {
        this.is_logged_in = false
        // Handle Errors here.
        var errorCode = error.code
        var errorMessage = error.message
        // The email of the user's account used.
        var email = error.email
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential
        if (errorCode === 'auth/account-exists-with-different-credential') {
          // TODO no alerts!
          alert('You have already signed up with a different auth provider for that email.')
          // If you are using multiple auth providers on your app you should handle linking
          // the user's accounts here.
        } else {
          console.error(error)
        }
      })
    },
    logOut () {
      firebase.auth().signOut()
      // TODO clear all user data
    },
    loadProjects () {
      this.projects = [];
      db.collection("projects")
        .get()
        .then(projects => {
          projects.forEach(project => {
            let p = project.data();
            p.id = project.id;
            this.projects.push(p);
          });
        });
    },
    loadProject (projectId) {
      db.collection('projects')
        .doc(projectId)
          .get()
          .then(doc => {
            // this.project = doc.data();
            let p = doc.data();
            p.id = doc.id;
            Vue.set(this, 'project', p);
          });
    },

    calculateRowState() {
      // Indicate row state with a poor-mans bitmask
      let rowState = 0;
      if (this.$store.state.show.in_sight) {
        rowState = rowState + 1
      }
      if (this.$store.state.show.out_of_mind) {
        rowState = rowState + 10
      }
      this.$store.state.show.row_state = rowState
    }

  },
  mounted() {
    this.loadProjects();

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        this.is_logged_in = true

        // TODO clear overlay

      } else {
        // No user is signed in.
        this.is_logged_in = false

        // TODO show login overlay

      }
    });

    this.calculateRowState()
  }
}
</script>