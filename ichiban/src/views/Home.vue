<template>
  <v-layout column
            class="flex-column">

    <!-- HACK -->
    <input type="hidden"
           :value="$store.state.data_ready"/>

    <!-- Floating action buttons -->
    <v-layout column
              class="fab-container">
      <v-btn fab
             v-shortkey="['ctrl', 'shift', 'n']"
             @shortkey="showAddTopicPopup"
             @click="showAddTopicPopup">
        <v-icon>add</v-icon>
      </v-btn>
      <v-btn fab
             v-shortkey="['ctrl', 'm']"
             @shortkey="toggleNavigationDrawer"
             @click.stop="toggleNavigationDrawer">
        <v-icon>menu</v-icon>
      </v-btn>
    </v-layout>

    <stages v-if="hasProject">
    </stages>
    <div v-else
         style="display: flex; align-items: center; height: 100%; width: 100%;">
      <div style="text-align: center; width: 100%;">
        <p>
          Looks like you're new here. Maybe you want to
        </p>
        <p>
          <v-btn @click="showNewProjectPopup">Create a New Project</v-btn>
        </p>
      </div>
    </div>

    <!-- Project popup -->
    <project-popup v-model="$store.state.project_popup">
    </project-popup>

    <!-- Stage popup -->
    <stage-popup v-model="$store.state.show_stage_popup">
    </stage-popup>

    <!-- Add Topic Popup -->
    <topic-popup v-model="$store.state.add_topic_popup">
    </topic-popup>

    <!-- Edit Topic Popup -->
    <topic-popup v-model="$store.state.edit_topic_popup">
    </topic-popup>

  </v-layout>
</template>

<script>
import _ from 'lodash';
import firebase from '@firebase/app';
import '@firebase/database';
import draggable from 'vuedraggable';
import TopicPopup from '@/components/TopicPopup.vue';
import ProjectPopup from '@/components/ProjectPopup.vue';
import StagePopup from '@/components/StagePopup.vue';
import Stages from '@/components/Stages.vue';

export default {
  components: {
    draggable,
    ProjectPopup,
    TopicPopup,
    StagePopup,
    Stages
  },
  data() {
    return {
      row_state: 0 // 0 = both open, 1 = top max, bottom min
    }
  },
  computed: {
    stageRefs () {
      let activeProject = this.$store.state.projects[this.$store.state.activeProjectId];
      if (!activeProject) {
        activeProject = this.$store.state.projects.getDefaultProject();
      }
      if (activeProject)
        return activeProject.stages;
    },
    isLoggedIn () {
      return this.$store.state.auth.isLoggedIn;
    },
    hasProject () {
      return this.$store.state.auth.isLoggedIn && ! this.$store.state.projects.isEmpty;
    }
  },
  methods: {
    toggleNavigationDrawer () {
      this.$store.state.drawer = ! this.$store.state.drawer;
    },
    showAddTopicPopup () {
      this.$store.dispatch('showAddTopicPopup');
    },
    requiredRule (value) {
      return value !== null && value !== ""
    },
    showNewProjectPopup () {
      this.$store.commit('showNewProjectPopup');
    },
  }
}
</script>

<style>
.draggable {
  min-height: 90%;
  min-width: 10px;
}
.fab-container {
  position: fixed;
  bottom: 0;
  right: 2em;
  max-height: 160px;
  z-index: 100;
}
</style>
