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
             v-on:click="showAddTopicPopup($store.state.stages[0])">
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
              v-for="(s, index) in [[0,1,2,3], [4,5,6,7]]">
      <v-flex xs3
              v-for="index in s"
              class="flex-item"
              :key="index">
        <v-card class="flex-card elevation-4">
          <v-card-title class="subheader">
            <a @click="showStagePopup($store.state.stages[index])">
              {{ $store.state.stages[index].name }}
            </a>
          </v-card-title>
          <v-card-text class="flex-card-body">
            <draggable v-model="$store.state.stages[index].topics"
                       :options="{group:'stages'}"
                       @end="onEnd"
                       class="draggable">
              <v-card v-for="(topic, index) in $store.state.stages[index].topics"
                      :key="index"
                      class="elevation-2 mb-1">
                <v-card-title @click="showEditTopicPopup(topic)">
                  {{ topic.name }}
                </v-card-title>
              </v-card>
            </draggable>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

    <!-- Add Topic Popup -->
    <topic-popup v-model="add_topic_popup">
    </topic-popup>

    <v-dialog v-model="show_stage_popup.visible"
              max-width="50vw">
      <v-card>
        <v-card-title>
          <span class="headline">{{ show_stage_popup.stage.name }}</span>
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-tile v-for="(topic, index) in show_stage_popup.stage.topics"
                         :key="index">
              <v-list-tile-content>
                <v-list-tile-title v-html="topic.name"></v-list-tile-title>
                <v-list-tile-sub-title v-html="topic.description"></v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <v-btn @click="$store.dispatch('deleteTopicFromStageByIndex', {stage: show_stage_popup.stage, topic_index: index})">
                  <v-icon>delete</v-icon>
                </v-btn>
              </v-list-tile-action>
            </v-list-tile>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Edit Topic Popup -->
    <topic-popup v-model="edit_topic_popup">
    </topic-popup>

  </v-layout>
</template>

<script>
import _ from 'lodash'
import firebase from '@firebase/app'
import '@firebase/database'
import draggable from 'vuedraggable'
import TopicPopup from '@/components/TopicPopup.vue'
import { clone, TOPIC, STAGE } from '@/common'

export default {
  components: {
    draggable,
    TopicPopup
  },
  data() {
    return {
      row_state: 0, // 0 = both open, 1 = top max, bottom min
      add_topic_popup: {
        visible: false,
        stage: {},
        stage_name: null,
        topic: clone(TOPIC)
      },
      edit_topic_popup: {
        visible: false,
        topic: clone(TOPIC)
      },
      show_stage_popup: {
        visible: false,
        stage: clone(STAGE)
      },
      events: [
      ]
    }
  },
  methods: {
    // Draggable onEnd method
    onEnd (event) {
      // Send data.stages to Firebase
      this.$store.dispatch('saveStagesToFirebase')
    },

    // Add Topic popup
    showAddTopicPopup (stage) {
      this.add_topic_popup.topic = clone(TOPIC)
      if (stage) {
        this.add_topic_popup.stage_name = stage.name
      }
      this.add_topic_popup.visible = true
    },
    // Edit Topic popup
    showEditTopicPopup (topic) {
      this.edit_topic_popup.topic = topic
      this.edit_topic_popup.visible = true
    },

    showStagePopup (stage) {
      this.show_stage_popup.stage = stage
      this.show_stage_popup.visible = true
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
    }
  },
  mounted() {
    this.$store.dispatch('loadFromFirebase')
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
