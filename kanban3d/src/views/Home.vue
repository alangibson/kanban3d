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
      <v-flex xs3
              v-for="index in s"
              class="flex-item"
              :key="index">
        <!--<stage :index="index"-->
               <!--:stage="$store.state.stages[$store.getters.project.stages[index].id]"-->
               <!--:stageId="$store.getters.project.stages[index].id"></stage>-->
        <stage :index="index"
               :stage="stageByIndex(index)"></stage>
      </v-flex>
    </v-layout>

    <!-- Stage popup -->
    <v-dialog v-model="$store.state.show_stage_popup.visible"
              max-width="50vw">
      <v-card>
        <v-card-title>
          <span class="headline">{{ $store.state.show_stage_popup.stage.name }}</span>
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-tile v-for="(topic, index) in $store.state.show_stage_popup.stage.topics"
                         :key="index">
              <v-list-tile-content>
                <v-list-tile-title v-html="topic.name"></v-list-tile-title>
                <v-list-tile-sub-title v-html="topic.description"></v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <v-btn @click="$store.dispatch('deleteTopicFromStageByIndex', {stage: $store.state.show_stage_popup.stage, topic_index: index})">
                  <v-icon>delete</v-icon>
                </v-btn>
              </v-list-tile-action>
            </v-list-tile>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

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
import Stage from '@/components/Stage.vue';
import { clone, TOPIC, STAGE } from '@/common';

export default {
  components: {
    draggable,
    TopicPopup,
    Stage
  },
  data() {
    return {
      row_state: 0 // 0 = both open, 1 = top max, bottom min
    }
  },
  methods: {
    showAddTopicPopup (stage) {
      if (! this.$store.getters.project) {
        return;
      }
      // Default to first Stage
      console.log('showAddTopicPopup', stage, this.$store.getters.project.stages[0]);
      if (! stage) {
        stage = this.$store.getters.project.stages[0];
      }
      this.$store.commit('showAddTopicPopup', stage);
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
.flex-row-maximized {
  height: 93vh !important;
}
.draggable {
  min-height: 90%;
}
.flex-item {
}
.flex-card {
  height: 100% !important;
  overflow: hidden;
}
.flex-card-body {
  height: 93% !important;
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
