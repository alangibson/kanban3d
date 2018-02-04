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
      </v-list>
    </v-navigation-drawer>

    <v-content>
      <v-container fluid fill-height grid-list-md>

        <!--<v-btn-->
          <!--@click.stop="drawer = !drawer"-->
          <!--fixed-->
          <!--fab-->
          <!--bottom-->
          <!--left>-->
          <!--<v-icon>menu</v-icon>-->
        <!--</v-btn>-->

        <router-view/>

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
import firebase from '@firebase/app'
import '@firebase/auth'

export default {
  computed: {
    showLogInOverlay() {
      return !this.is_logged_in
    }
  },
  data: () => ({
    drawer: false,
    is_logged_in: false
  }),
  methods: {
    logIn() {
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
    logOut() {
      firebase.auth().signOut()
      // TODO clear all user data
    }
  },
  mounted() {
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
    })
  }
}
</script>