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
             v-on:click="showAddTopicPopup()">
        <v-icon>add</v-icon>
      </v-btn>
      <v-btn fab
             @click.stop="$store.state.drawer = !$store.state.drawer">
        <v-icon>menu</v-icon>
      </v-btn>
    </v-layout>

    <!-- Stages -->
    <v-layout row
              :class="rowClass(index)"
              v-for="(s, index) in rowChunks()">
      <v-flex v-for="index in s"
              :class="colClass(index)"
              :key="index">
        <stage :index="index"
               :class="colClass(index)"
               :stage="stageByIndex(index)"></stage>
      </v-flex>
    </v-layout>

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

export default {
  components: {
    draggable,
    ProjectPopup,
    TopicPopup,
    StagePopup,
    Stage
  },
  data() {
    return {
      row_state: 0 // 0 = both open, 1 = top max, bottom min
    }
  },
  methods: {
    showAddTopicPopup (stage) {
      // if (! this.$store.getters.project) {
      //   return;
      // }
      // // Default to first Stage
      // console.log('showAddTopicPopup', stage, this.$store.getters.project.stages[0]);
      // if (! stage) {
      //   stage = this.$store.getters.project.stages[0];
      // }
      // this.$store.commit('showAddTopicPopup', stage);
      this.$store.dispatch('showAddTopicPopup', stage);
    },
    stageByIndex (index) {
      return this.$store.getters.project.stages[index];
    },
    requiredRule (value) {
      return value !== null && value !== ""
    },
    rowClass (row_index) {
      if (row_index === 0 && this.$store.state.show.row_state === 10) {
        return 'flex-row-minimized'
      } else if (row_index === 1 && this.$store.state.show.row_state === 1) {
        return 'flex-row-minimized'
      } else if (this.$store.state.show.row_state === 0 || this.$store.state.show.row_state === 11) {
        return 'flex-row'
      }
      return 'flex-row-maximized'
    },
    colClass (index) {
      if ((index === 0 || index === 4) && ! this.$store.state.show.future) {
        return 'flex-item-hidden';
      } else if ((index === 1 || index === 2 || index === 5 || index === 6 ) && ! this.$store.state.show.present) {
        return 'flex-item-hidden';
      } else if ((index === 3 || index === 7) && ! this.$store.state.show.past) {
        return 'flex-item-hidden';
      }
      return 'flex-item';
    },
    rowChunks () {
      // [[0,1,2,3], [4,5,6,7]]
      if (this.$store.getters.project) {
        return _.chunk(_.range(this.$store.getters.project.stages.length), 4);
      }
    }
  },
  mounted() {
    console.log('Home mounted');
  }
}
</script>

<style>
.flex-column {
}
.flex-row {
  height: 49vh !important;
}
.flex-row-minimized {
  height: 5vh !important;
}
.flex-row-minimized .topic {
  display: none;
}
/*.flex-row-minimized .stage {*/
  /*overflow: hidden;*/
/*}*/
.flex-row-minimized .stage .flex-card-body {
  height: 50px !important;
  overflow: hidden;
}
.flex-row-maximized {
  height: 80vh !important;
}
.draggable {
  min-height: 90%;
}
.flex-item {
  flex: 1 !important;
}
.flex-item-hidden {
  width: 5ch;
  flex: 0 !important;
  overflow: hidden;
  /*background-color: #1976D2;*/
}
.flex-card {
  height: 100% !important;
  overflow: hidden;
}
.flex-card-body {
  /*height: 93% !important;*/
  height: 93%;
  overflow-y: auto;
}
.fab-container {
  position: fixed;
  bottom: 0;
  right: 2em;
  max-height: 160px;
  z-index: 100;
}
</style>
