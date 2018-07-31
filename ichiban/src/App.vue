<template>
  <v-app>

    <v-navigation-drawer
        app
        fixed
        v-model="$store.state.drawer">
      <v-list dense>

        <!-- user name and avatar -->
        <v-list-tile avatar>
          <v-list-tile-avatar>
            <img :src="avatarUrl">
          </v-list-tile-avatar>
          <v-list-tile-content>
            <v-list-tile-title>{{userFullName}}</v-list-tile-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <v-list-tile v-if="isLoggedIn" @click="$store.dispatch('auth/logOut')">
              <v-icon>lock_open</v-icon>
            </v-list-tile>
          </v-list-tile-action>
        </v-list-tile>

        <!-- Project -->
        <v-subheader>Project</v-subheader>
        <v-list-tile>
          <v-list-tile-content>
            <v-select
                :items="projects"
                v-model="selectedProject"
                item-text="name"
                item-value="id"
                label="Select"
                single-line>
            </v-select>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile>
          <v-list-tile-content>
            <v-layout>
              <v-flex xs6>
                <v-btn @click="deleteProject">Delete</v-btn>
              </v-flex>
              <v-flex xs6>
                <v-btn @click="showNewProjectPopup">New</v-btn>
              </v-flex>
            </v-layout>
          </v-list-tile-content>
        </v-list-tile>

        <!-- Visibility -->
        <v-subheader>Visibility</v-subheader>
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
        <v-list-tile>
          <v-checkbox label="Past"
                      @change="calculateRowState"
                      v-model="$store.state.show.past"/>
        </v-list-tile>
        <v-list-tile>
          <v-checkbox label="Present"
                      @change="calculateRowState"
                      v-model="$store.state.show.present"/>
        </v-list-tile>
        <v-list-tile>
          <v-checkbox label="Future"
                      @change="calculateRowState"
                      v-model="$store.state.show.future"/>
        </v-list-tile>
      </v-list>

      <!-- Shortcuts -->
      <v-subheader>Shortcuts</v-subheader>
      <v-list-tile>
        <v-list-tile-content>
          <v-list-tile-title>Toggle Navigation Drawer</v-list-tile-title>
          <v-list-tile-sub-title>Ctrl+M</v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>
      <v-list-tile>
        <v-list-tile-content>
          <v-list-tile-title>New Topic</v-list-tile-title>
          <v-list-tile-sub-title>Ctrl+Shift+N</v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>
      <v-list-tile>
        <v-list-tile-content>
          <v-list-tile-title>Save and Close Topic</v-list-tile-title>
          <v-list-tile-sub-title>Ctrl+Enter</v-list-tile-sub-title>
        </v-list-tile-content>
      </v-list-tile>

      <v-subheader>Links</v-subheader>
      <v-list-tile>
        <v-list-tile-content>
          <v-list-tile-title><router-link to="/privacy"><a>Privacy</a></router-link></v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>

    </v-navigation-drawer>

    <v-content>
      <v-container fluid fill-height grid-list-md>
        <router-view/>
        <login-popup></login-popup>
      </v-container>
    </v-content>

  </v-app>
</template>

<script>
import firebase from '@firebase/app'
import '@firebase/auth'

import LoginPopup from '@/components/LoginPopup'

export default {
  components: {
    LoginPopup
  },
  computed: {
    isLoggedIn () {
      return this.$store.state.auth.isLoggedIn;
    },
    projects () {
      let projects = [];
      _.forOwn(this.$store.state.projects, (value, key) => {
        projects.push({
          id: key,
          name: value.name
        });
      });
      return projects;
    },
    selectedProject: {
      get () {
        return this.$store.getters.project;
      },
      set (project_id) {
        this.$store.dispatch('selectProjectById', project_id);
      }
    },
    avatarUrl () {
      if (this.$store.state.auth.user) {
        return this.$store.state.auth.user.photoURL;
      }
    },
    userFullName () {
      if (this.$store.state.auth.user) {
        return this.$store.state.auth.user.displayName;
      }
    }
  },
  data: () => ({
    drawer: false
  }),
  methods: {
    calculateRowState() {
      // Indicate row state with a poor-mans bitmask
      let rowState = 0
      if (this.$store.state.show.in_sight) {
        rowState = rowState + 1
      }
      if (this.$store.state.show.out_of_mind) {
        rowState = rowState + 10
      }
      this.$store.state.show.row_state = rowState
    },
    showNewProjectPopup () {
      this.$store.commit('showNewProjectPopup');
    },
    // newProject (project_name) {
    //   this.$store.dispatch('newProject', { project_name });
    // },
    deleteProject () {
      this.$store.dispatch('deleteProject', this.selectedProject);
    }
  },
  mounted() {
    // Listen for changes in authentication state
    // firebase.auth()
    //   .onAuthStateChanged(user => {
    //     console.log('Firestore auth state changed', user);
    //     if (user) {
    //       this.$store.dispatch('auth/handleAuthStateChanged', user)
    //         .then(() => {
    //           this.$store.dispatch('startUp', user);
    //         });
    //     } else {
    //       // User signed out
    //       this.$store.dispatch('auth/handleAuthStateChanged', user)
    //         .then(() => {
    //           this.$store.dispatch('shutDown');
    //         });
    //     }
    //   });
    this.$store.dispatch('startUp');
    this.calculateRowState()
  }
}
</script>