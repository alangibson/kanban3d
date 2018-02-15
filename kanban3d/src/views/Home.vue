<template>
  <v-layout column
            class="flex-column">

    <!-- HACK -->
    <input type="hidden"
           :value="this.data_ready"/>

    <!-- Floating action buttons -->
    <v-layout column
              class="fab-container">
      <!--<v-btn fab-->
             <!--v-on:click="toggleRowState">-->
        <!--<v-icon>lightbulb_outline</v-icon>-->
      <!--</v-btn>-->
      <v-btn fab
             v-on:click="showAddTopicPopup(stages[0])">
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
            <a @click="showStagePopup(stages[index])">
              {{ stages[index].name }}
            </a>
          </v-card-title>
          <v-card-text class="flex-card-body">
            <draggable v-model="stages[index].topics"
                       :options="{group:'stages'}"
                       @end="onEnd"
                       class="draggable">
              <v-card v-for="(topic, index) in stages[index].topics"
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
    <v-dialog v-model="add_topic_popup.visible"
              max-width="700px">
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
                  <v-text-field
                      v-model="add_topic_popup.topic.who"
                      label="Who" />
                  <v-text-field
                      v-model="add_topic_popup.topic.when"
                      label="When" />
                  <v-text-field
                      v-model="add_topic_popup.topic.where"
                      label="Where" />
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
          <v-btn color="blue darken-1"
                 flat
                 @click.native="cancelTopicPopup">
            Close
          </v-btn>
          <v-btn color="blue darken-1"
                 flat
                 @click.native="saveAndCloseTopicPopup">
            Save and Close
          </v-btn>
          <v-btn color="blue darken-1"
                 flat
                 @click.native="saveAddTopicPopup">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
                <v-btn @click="deleteTopicFromStageByIndex(show_stage_popup.stage, index)">
                  <v-icon>delete</v-icon>
                </v-btn>
              </v-list-tile-action>
            </v-list-tile>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Edit Topic Popup -->
    <v-dialog v-model="edit_topic_popup.visible"
              max-width="50vw">
      <v-card>
        <v-card-title>
          <span class="headline">Edit Topic</span>
        </v-card-title>
        <v-card-text>
          <v-container grid-list-md>
            <v-form ref="editTopicForm">
              <v-layout wrap>
                <v-flex xs12>
                  <v-text-field
                      v-model="edit_topic_popup.topic.name"
                      label="Name"
                      autofocus
                      :rules="[requiredRule]"
                      required />
                  <v-text-field
                      v-model="edit_topic_popup.topic.description"
                      label="Description"
                      multi-line />
                  <v-text-field
                      v-model="edit_topic_popup.topic.who"
                      label="Who" />
                  <v-text-field
                      v-model="edit_topic_popup.topic.when"
                      label="When" />
                  <v-text-field
                      v-model="edit_topic_popup.topic.where"
                      label="Where" />
                </v-flex>
              </v-layout>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1"
                 flat
                 @click.native="saveAndCloseEditTopicPopup">
            Save and Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-layout>
</template>

<script>
import _ from 'lodash'
import firebase from '@firebase/app'
import '@firebase/database'
import draggable from 'vuedraggable'
import uuid from 'uuid/v4'

function clone(o) {
  return JSON.parse(JSON.stringify(o))
}

// Default objects
const TOPIC = {
  id: null,           // uuid as string
  name: null,         // string
  description: null,  // string
  who: null,          // string
  when: null,         // ISO8601 datetime as string
  where: null         // string
}
const STAGE = {
  name: null,
  topics: []
}

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
      ],
      events: [

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

    // Add Topic popup
    showAddTopicPopup(stage) {
      this.add_topic_popup.topic = clone(TOPIC)
      if (stage) {
        this.add_topic_popup.stage_name = stage.name
      }
      this.add_topic_popup.visible = true
    },
    resetAddTopicPopup() {
      this.add_topic_popup.topic = clone(TOPIC)
      let stage_name = this.add_topic_popup.stage_name
      this.$refs.addTopicForm.reset()
      this.add_topic_popup.stage_name = stage_name
    },
    saveAddTopicPopup() {
      // Cancel save if form validation fails
      if (!this.$refs.addTopicForm.validate()) {
        return
      }
      // Save new topic
      let newTopic = clone(this.add_topic_popup.topic)
      newTopic.id = uuid()
      // Even though we loop over all stages, a topic can only be in 1 stage
      this.stages.forEach((stage) => {
        if (stage.name === this.add_topic_popup.stage_name) {
          stage.topics.unshift(newTopic)
        }
      })
      this.saveStagesToFirebase()
      this.resetAddTopicPopup()
    },
    saveAndCloseTopicPopup() {
      this.add_topic_popup.visible = false
      this.saveAddTopicPopup()
    },
    cancelTopicPopup() {
      this.add_topic_popup.visible = false
      this.resetAddTopicPopup()
    },

    // Edit Topic popup
    showEditTopicPopup(topic) {
      this.edit_topic_popup.topic = topic
      this.edit_topic_popup.visible = true
    },
    saveAndCloseEditTopicPopup() {
      this.edit_topic_popup.topic = clone(TOPIC)
      this.saveStagesToFirebase()
      this.edit_topic_popup.visible = false
    },

    deleteTopicFromStageByIndex(stage, topic_index) {
      stage.topics.splice(topic_index, 1)
      this.saveStagesToFirebase()
    },
    showStagePopup(stage) {
      this.show_stage_popup.stage = stage
      this.show_stage_popup.visible = true
    },
    requiredRule(value) {
      return value !== null && value !== ""
    },

    rowClass(row_index) {
      if (row_index === 0 && this.$store.state.show.row_state === 10) {
        return 'flex-row-minimized'
      } else if (row_index === 1 && this.$store.state.show.row_state === 1) {
        return 'flex-row-minimized'
      } else if (this.$store.state.show.row_state === 0 || this.$store.state.show.row_state === 11) {
        return 'flex-row'
      }
      return 'flex-row-maximized'
    }
    // toggleRowState() {
    //   this.row_state++
    //   if (this.row_state > 2) {
    //     this.row_state = 0
    //   }
    // }
  },
  mounted() {
    // Load all data from Firebase
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
