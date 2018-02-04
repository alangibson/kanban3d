<template>
  <v-layout row wrap class="flex-container" style="">

    <!-- HACK -->
    <input type="hidden" :value="this.data_ready"/>

    <!-- Floating action buttons -->
    <v-layout column class="fab-container">
      <v-btn
          fab
          v-on:click="showAddTopicPopup(stages[0])">
        <v-icon>add</v-icon>
      </v-btn>
      <v-btn
          fab
          @click.stop="$store.state.drawer = !$store.state.drawer">
        <v-icon>menu</v-icon>
      </v-btn>
    </v-layout>

    <!-- Stages -->
    <v-flex xs3 v-for="(stage, index) in stages" class="flex-item" :key="index" style="">
      <v-card class="flex-card elevation-4 " style="">
        <v-card-title class="subheader">
          <a @click="showStagePopup(stage)">
            {{ stage.name }}
          </a>
        </v-card-title>
        <v-card-text class="flex-card-body" style="">
          <draggable v-model="stage.topics" :options="{group:'stages'}" @end="onEnd"
                     style="min-height: 80%">
            <v-card v-for="(topic, index) in stage.topics" :key="index" class="elevation-1 mb-1">
              <v-card-title @click="showTopicPopup(topic)">
                {{ topic.name }}
              </v-card-title>
            </v-card>
          </draggable>
        </v-card-text>
      </v-card>
    </v-flex>

    <v-dialog v-model="show_add_task_popup" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Add Topic</span>
        </v-card-title>
        <v-card-text>
          <v-container grid-list-md>
            <v-form ref="addTopicForm">
              <v-layout wrap>
                <v-flex xs12>
                  <v-text-field
                    v-model="add_topic_popup.topic.name"
                    label="Name"
                    autofocus
                    :rules="[requiredRule]"
                    required />
                  <v-text-field
                    v-model="add_topic_popup.topic.description"
                    label="Description"
                    multi-line />
                </v-flex>
                <v-flex xs12>
                  <v-select
                    label="Stage"
                    required
                    :rules="[requiredRule]"
                    v-model="add_topic_popup.stage_name"
                    :items="stages"
                    item-text="name"
                    item-value="name" />
                </v-flex>
              </v-layout>
            </v-form>
          </v-container>
          <small>*indicates required field</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click.native="cancelTopicPopup">
            Close
          </v-btn>
          <v-btn color="blue darken-1" flat @click.native="saveTopicPopup">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="show_stage_popup.visible" max-width="80%">
      <v-card>
        <v-card-title>
          <span class="headline">{{ show_stage_popup.stage.name }}</span>
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-tile v-for="(topic, index) in show_stage_popup.stage.topics" :key="index">
              <v-list-tile-content>
                <v-list-tile-title v-html="topic.name"></v-list-tile-title>
                <v-list-tile-sub-title v-html="topic.description"></v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <v-btn @click="deleteTopicFrpmStageByIndex(show_stage_popup.stage, index)">
                  <v-icon>delete</v-icon>
                </v-btn>
              </v-list-tile-action>
            </v-list-tile>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="show_topic_popup.visible" max-width="80%">
      <v-card>
        <v-card-title>
          <span class="headline">{{ show_topic_popup.topic.name }}</span>
        </v-card-title>
        <v-card-text>
          {{ show_topic_popup.topic.description }}
        </v-card-text>
      </v-card>
    </v-dialog>

  </v-layout>
</template>

<script>
import Vue from 'vue'
import _ from 'lodash'
import firebase from '@firebase/app'
import '@firebase/database'
import draggable from 'vuedraggable'

// Initialize Firebase
var config = {
  apiKey: "AIzaSyDtMhmkNw3dAFX9J1DV3kYUf8SEnjt-MkQ",
  authDomain: "kanban3d.firebaseapp.com",
  databaseURL: "https://kanban3d.firebaseio.com",
  projectId: "kanban3d",
  storageBucket: "kanban3d.appspot.com",
  messagingSenderId: "101979808277"
}
firebase.initializeApp(config)

export default {
  components: {
    draggable
  },
  data() {
    return {
      data_ready: false,
      show_add_task_popup: false,
      add_topic_popup: {
        stage: {},
        stage_name: null,
        topic: {
          name: null,
        }
      },
      show_stage_popup: {
        visible: false,
        stage: {
          name: null,
          topics: []
        }
      },
      show_topic_popup: {
        visible: false,
        topic: {
          name: null,
          description: null
        }
      },
      stages: [
        {
          name: 'Soon',
          topics: [
          ]
        },
        {
          name: 'In Progress',
          topics: [
          ]
        },
        {
          name: 'Paused',
          topics: []
        },
        {
          name: 'Done',
          topics: []
        },
        {
          name: 'Someday',
          topics: [
          ]
        },
        {
          name: 'Handed Off',
          topics: []
        },
        {
          name: 'Blocked',
          topics: []
        },
        {
          name: 'Canceled',
          topics: []
        }
      ]
    }
  },
  methods: {
    onEnd(event) {
      // Send data.stages to Firebase
      this.saveStagesToFirebase()
    },
    // Save data.stages to Firebase
    saveStagesToFirebase() {
      firebase.database()
        .ref('stages')
        .set(this.stages)
    },
    resetTopicPopup() {
      this.add_topic_popup.topic.name = null
      this.add_topic_popup.stage_name = null
      // this.add_topic_popup.stage = { name: null }
    },
    saveTopicPopup() {
      // Cancel save if form validation fails
      // TODO just check the data directly instead?
      if (!this.$refs.addTopicForm.validate()) {
        return
      }
      // Save new topic
      this.stages.forEach((stage) => {
        if (stage.name === this.add_topic_popup.stage_name) {
          let cloneTopic = JSON.parse(JSON.stringify(this.add_topic_popup.topic))
          stage.topics.unshift(cloneTopic)
        }
      })
      this.saveStagesToFirebase()
      this.show_add_task_popup = false
      this.resetTopicPopup()
    },
    showTopicPopup(topic) {
      this.show_topic_popup.visible=true
      this.show_topic_popup.topic = topic
    },
    cancelTopicPopup() {
      this.show_add_task_popup = false
      this.resetTopicPopup()
    },
    showAddTopicPopup(stage) {
      this.add_topic_popup.topic.name = null
      // this.add_topic_popup.stage = stage
      if (stage) {
        this.add_topic_popup.stage_name = stage.name
      }
      this.show_add_task_popup = true
    },
    deleteTopicFrpmStageByIndex(stage, topic_index) {
      stage.topics.splice(topic_index, 1)
      this.saveStagesToFirebase()
    },
    showStagePopup(stage) {
      this.show_stage_popup.stage = stage
      this.show_stage_popup.visible=true
    },
    requiredRule(value) {
      return value !== null && value !== ""
    }
  },
  mounted() {
    firebase.database()
      .ref('stages')
      .on('value', (snapshot) => {
        let newStages = snapshot.val()
        if (newStages === null) {
          // TODO init data
          return
        }
        _.merge(this.stages, newStages)
        // HACK
        this.data_ready = true
      })
  }
}
</script>

<style>
.flex-container {
  /*background-color: purple;*/
}
.flex-item {
  height: 50%;
  flex-grow: 1;
  /*flex-basis: 50%;*/
}
.flex-card {
  height: 100% !important;
  /*overflow-y: scroll;*/
  overflow: hidden;
}
.flex-card-body {
  height: 100% !important;
  overflow-y: auto;
}
.fab-container {
  /*border: 1px solid red;*/
  position: fixed;
  bottom: 0;
  right: 2em;
  max-height: 160px;
  z-index: 100;
}
</style>
