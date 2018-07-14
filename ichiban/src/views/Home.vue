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

    <stages v-if="isLoggedIn">
    </stages>

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
import Stage from '@/components/Stage.vue';
import Stages from '@/components/Stages.vue';

export default {
  components: {
    draggable,
    ProjectPopup,
    TopicPopup,
    StagePopup,
    // Stage,
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
    }
  },
  methods: {
    toggleNavigationDrawer () {
      this.$store.state.drawer = ! this.$store.state.drawer;
    },
    showAddTopicPopup (stage) {
      this.$store.dispatch('showAddTopicPopup', stage);
    },
    // stageByIndex (index) {
    //   return this.$store.getters.project.stages[index];
    // },
    requiredRule (value) {
      return value !== null && value !== ""
    },
    // rowClass (row_index) {
    //   if (row_index === 0 && this.$store.state.show.row_state === 10) {
    //     return 'flex-row-minimized'
    //   } else if (row_index === 1 && this.$store.state.show.row_state === 1) {
    //     return 'flex-row-minimized'
    //   } else if (this.$store.state.show.row_state === 0 || this.$store.state.show.row_state === 11) {
    //     return 'flex-row'
    //   }
    //   return 'flex-row-maximized'
    // },
    // colClass (index) {
    //   if ((index === 0 || index === 4) && ! this.$store.state.show.future) {
    //     return 'flex-item-hidden';
    //   } else if ((index === 1 || index === 2 || index === 5 || index === 6 ) && ! this.$store.state.show.present) {
    //     return 'flex-item-hidden';
    //   } else if ((index === 3 || index === 7) && ! this.$store.state.show.past) {
    //     return 'flex-item-hidden';
    //   }
    //   return 'flex-item';
    // },
    // rowChunks () {
    //   // [[0,1,2,3], [4,5,6,7]]
    //   if (this.$store.getters.project) {
    //     return _.chunk(_.range(this.$store.getters.project.stages.length), 4);
    //   }
    // }
  }
}
</script>

<style>

/*.flex-column {*/
/*}*/

/*.flex-row {*/
  /*height: 49vh !important;*/
/*}*/
/*.flex-row-minimized {*/
  /*height: 5vh !important;*/
/*}*/
/*.flex-row-minimized .topic {*/
  /*display: none;*/
/*}*/
/*.flex-row-minimized .stage .flex-card-body {*/
  /*height: 50px !important;*/
  /*overflow: hidden;*/
/*}*/
/*.flex-row-maximized {*/
  /*height: 80vh !important;*/
/*}*/

.draggable {
  min-height: 90%;
  min-width: 10px;
}

/*.flex-item {*/
  /*flex: 1 !important;*/
/*}*/

/*.flex-item-hidden {*/
  /*min-width: 5ch;*/
  /*flex: 0 !important;*/
  /*overflow: hidden;*/
/*}*/
/*.flex-item-hidden .card__title.subheader {*/
  /*-webkit-transform: rotate(90deg);*/
  /*-moz-transform: rotate(90deg);*/
  /*-ms-transform: rotate(-90deg);*/
  /*-o-transform: rotate(-90deg);*/
/*}*/
/*.flex-item-hidden .topic {*/
  /*display: none;*/
/*}*/

/*.flex-card {*/
  /*height: 100% !important;*/
  /*overflow: hidden;*/
/*}*/
/*.flex-card-body {*/
  /*!*height: 93% !important;*!*/
  /*height: 93%;*/
  /*overflow-y: auto;*/
/*}*/

.fab-container {
  position: fixed;
  bottom: 0;
  right: 2em;
  max-height: 160px;
  z-index: 100;
}

</style>
