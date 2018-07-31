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

    console.log('setAuthenticatedUser', user);

    if (user) {
      context.commit('setIsLoggedIn', true);
      context.commit('setAuthenticatedUser', user);
    } else {
      context.commit('setIsLoggedIn', false);
      context.commit('setAuthenticatedUser', null);
    }
  },
  /**
   * Callback for notifying module when Firebase auth state has changed.
   * @param context
   * @param user Firebase user object
   */
  handleAuthStateChanged (context, user) {
    if (user) {
      context.commit('setIsLoggedIn', true);
      context.commit('setAuthenticatedUser', user);
      context.commit('showDrawer', true, {root: true});
    } else {
      context.commit('setIsLoggedIn', false);
    }
  },
  logIn (context) {
    // Create an authentication provider
    let provider = new firebase.auth.GoogleAuthProvider();
    // Sign in
    firebase.auth()
      .signInWithPopup(provider)
      .then(result => {
        // Everything that needs to be loaded will be done reactively by handleAuthStateChanged
      })
      .catch(error => {
        // Everything that needs to be unloaded will be done reactively by handleAuthStateChanged
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
            context.commit('setAuthenticatedUser', null);
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