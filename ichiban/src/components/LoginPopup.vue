<template>
  <v-dialog
      v-show="showLogInOverlay"
      persistent
      style="align: center"
      v-model="showLogInOverlay">

      <v-card class="pa-5">

        <v-card-title>
          <span class="headline">Welcome To Ichiban</span>
        </v-card-title>

        <v-card-text>

          <v-alert v-if="wXS"
                   :value="true"
                   type="warning">
            Ichiban is designed for large screens.
          </v-alert>

          <p style="margin-bottom: 2em;">
            Ichiban is kanban for one.
          </p>
          <p style="margin-bottom: 2em;">
            Ichiban reduces cognitive load by keeping track of your tasks and their progress.
            Your mind is left free to get work done without having to do mental accounting.
          </p>

          <stages id="login-stages"></stages>

          <div style="text-align: center; padding-top: 4em;">
            <v-btn @click="$store.dispatch('auth/logIn')">
              <i class="fa fa-google"></i>&nbsp; Log In with Google
            </v-btn>
          </div>

        </v-card-text>

      </v-card>

  </v-dialog>

</template>

<script>
import Vue from 'vue';
import VueMediaQueryMixin from 'vue-media-query-mixin';
// import uuid from 'uuid/v4';
import Stages from '@/components/Stages.vue';
// import { ProjectsMap, StagesMap, TopicsMap, Project, Stage, Topic, StageRef, TopicRef } from '@/models';
// import { DemoProjects, DemoStages, DemoTopics, DemoActiveProjectId } from '@/models/demo';
import demoProjectGenerator from '@/models/demo';

Vue.use(VueMediaQueryMixin, {framework:'vuetify'});

export default {
  components: {
    Stages
  },
  computed: {
    showLogInOverlay() {
      // When we aren't logged in, set a demo project as active project
      if (! this.$store.state.auth.isLoggedIn) {
        // We're not logged in
        let demoProject = demoProjectGenerator();
        this.$store.commit('setTopics', demoProject.topics);
        this.$store.commit('setStages', demoProject.stages);
        this.$store.commit('setProjects', demoProject.projects);
        this.$store.commit('setActiveProjectId', demoProject.activeProjectId);
      }
      else {
        // We're logged in
        if ( ( ! this.$store.state.activeProjectId || this.$store.state.activeProjectId === 'demo-project' ) && this.$store.state.projects ) {
          this.$store.commit('setActiveProjectId', this.$store.state.projects.getDefaultProjectId());
        }
      }
      return ! this.$store.state.auth.isLoggedIn;
    }
  },
  mounted () {
  }
}
</script>

<style>
#login-stages .flex-row {
  height: 15rem !important;
}

</style>