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
import uuid from 'uuid/v4';
import Stages from '@/components/Stages.vue';
import { ProjectsMap, StagesMap, TopicsMap, Project, Stage, Topic, StageRef, TopicRef } from '@/models';

export default {
  components: {
    Stages
  },
  computed: {
    showLogInOverlay() {
      // When we aren't logged in, set a demo project as active project
      if (! this.$store.state.auth.isLoggedIn) {
        let projects = new ProjectsMap();
        let topics = new TopicsMap();
        let stages = new StagesMap();
        let stageRefs = [];
        let stageKeys = [
          ['soon', 'Soon', 'Upcoming topics that need your attention'],
          ['in progress', 'In Progress', 'Topics you\'re actively working on'],
          ['paused', 'Paused', 'Topics that you\re taking a break from'],
          ['done', 'Done', 'Finished topics'],
          ['someday', 'Someday', 'Low value topics you might do someday'],
          ['handed off', 'Handed Off', 'Topics you\'ve delegated to someone else'],
          ['blocked', 'Blocked', 'Topics you can\'t work on right now due to external forces'],
          ['cancelled', 'Cancelled', 'Topics you never needed in the first place']
        ];
        // Note: Do not change projectId. Is used in check when setting new active project after login.
        let projectId = 'demo-project';
        let project = new Project();
        stageKeys.forEach(keyName => {
          let stage = new Stage();
          stage.name = keyName[1];
          stages[keyName[0]] = stage;
          let stageRef = new StageRef(keyName[0], null);
          stageRefs.push(stageRef);
          project.stages.push(stageRef);
          let topicId = uuid();
          topics[topicId] = new Topic();
          topics[topicId]._name = keyName[2];
          stages[keyName[0]].topics.push(new TopicRef(topicId, null));
        });
        projects[projectId] = project;
        this.$store.commit('setTopics', topics);
        this.$store.commit('setStages', stages);
        this.$store.commit('setProjects', projects);
        this.$store.commit('setActiveProjectId', projectId);
      }
      else {
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