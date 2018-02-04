<template>
  <v-layout row class="flex-row" style="">

    <!-- column 1 -->
    <v-flex xs3 class="flex-column" style="">
      <v-flex class="flex-item" style="">
        <v-card class="flex-card elevation-20" style="">
          <v-card-title>Soon</v-card-title>
          <v-card-text style="">
            <v-card v-for="(topic, index) in stages.soon.topics">
              <v-card-title>{{ topic.name }}</v-card-title>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex class="flex-item" style="">
        <v-card class="flex-card elevation-20" style="">
          <v-card-title>Someday</v-card-title>
          <v-card-text>
            <v-card v-for="n in 10">
              <v-card-title>Topic 3</v-card-title>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-flex>

    <v-flex xs3 class="flex-column" style="">
      <v-flex class="flex-item" style="">
        <v-card class="elevation-20 flex-card" style="">
          <v-card-title>In Progress</v-card-title>
          <v-card-text>
            <v-card>
              <v-card-title>Topic 1</v-card-title>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex class="flex-item">
        <v-card class="flex-card elevation-20" style="">
          <v-card-title>Handed Off</v-card-title>
          <v-card-text>
            <v-card >
              <v-card-title>Topic 3</v-card-title>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-flex>

    <v-flex xs3 class="flex-column" style="">
      <v-flex class="flex-item" style="">
        <v-card class="elevation-20 flex-card" style="">
          <v-card-title>Paused</v-card-title>
          <v-card-text>
            <v-card>
              <v-card-title>Topic 1</v-card-title>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex class="flex-item">
        <v-card class="flex-card elevation-20" style="">
          <v-card-title>Blocked</v-card-title>
          <v-card-text>
            <v-card >
              <v-card-title>Topic 3</v-card-title>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-flex>

    <v-flex xs3 class="flex-column" style="">
      <v-flex class="flex-item" style="">
        <v-card class="elevation-20 flex-card" style="">
          <v-card-title>Done</v-card-title>
          <v-card-text>
            <v-card>
              <v-card-title>Topic 1</v-card-title>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex class="flex-item">
        <v-card class="flex-card elevation-20" style="">
          <v-card-title>Cancelled</v-card-title>
          <v-card-text>
            <v-card >
              <v-card-title>Topic 3</v-card-title>
            </v-card>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-flex>

  </v-layout>
</template>

<style>
.flex-row {
  /*background-color: purple;*/
}
.flex-column {
  /*background-color: blue;*/

  flex-direction: column;
  justify-content: flex-start; /* align items in Main Axis */
  align-items: stretch;   /* main axis*/
  align-content: stretch; /* cross axis*/
}
.flex-item {
  /*background-color: red;*/
  /*border-color: green;*/

  /*max-height: 50%;*/
  /*overflow-y: scroll;*/
  height: 50%;

  /* aka flex: 1 or flex: 1 1 auto */
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
}
.flex-card {
  height: 100% !important;
  overflow-y: scroll;
}
</style>

<script>
import draggable from 'vuedraggable'

export default {
  components: {
    draggable
  },
  data() {
    return {
      stages: {
        soon: {
          topics: [
            {
              name: 'Topic 1',
              todos: [
                {
                  name: 'Todo 1'
                }
              ]
            },
            {
              name: 'Topic 1-2',
              todos: []
            }
          ]
        },
        in_progress: {
          topics: [
            {
              name: 'Topic 2-1',
              todos: [
                {
                  name: 'Todo 2'
                }
              ]
            }
          ]
        }
      }
    }
  }
}
</script>