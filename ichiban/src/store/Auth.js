import Vuex from 'vuex';
import firebase from '@firebase/app';
import '@firebase/auth';

const state = {
  // Is user logged in?
  isLoggedIn: false,
  user: null
};

const actions = {
  setAuthenticatedUser (context, user) {
    if (user) {
      context.commit('setIsLoggedIn', true);
      context.commit('setAuthenticatedUser', user);
    } else {
      context.commit('setIsLoggedIn', false);
      context.commit('setAuthenticatedUser', null);
    }
  },
  logIn (context) {
    // Create an authentication provider
    let provider = new firebase.auth.GoogleAuthProvider();
    // Sign in
    firebase.auth()
      .signInWithPopup(provider)
      .then(result => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        // var token = result.credential.accessToken;
        // The signed-in user info.
        // var user = result.user;
        context.commit('setIsLoggedIn', true);
        context.commit('showDrawer', true, {root: true});
      })
      .catch(error => {
        context.commit('setIsLoggedIn', false);
        // Handle Errors here.
        // let errorCode = error.code
        // let errorMessage = error.message
        // The email of the user's account used.
        // let email = error.email
        // The firebase.auth.AuthCredential type that was used.
        // let credential = error.credential
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
  logOut (context) {
    firebase.auth()
      .signOut()
      .then(() => {
        console.log('Successfully signed out');
        // Reset state to default
        context.dispatch('reset', null, {root: true})
          .then(() => {
            context.commit('setIsLoggedIn', false);
          });
      })
      .catch(error => {
        console.error(error);
      })
  }
}

const mutations = {
  reset (state) {
    state.user = null;
  },
  setAuthenticatedUser (state, user) {
    state.user = user;
  },
  setIsLoggedIn (state, isLoggedIn) {
    state.isLoggedIn = isLoggedIn
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}