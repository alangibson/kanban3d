<template>
  <v-card class="stage flex-card elevation-4">
    <v-card-title class="subheader"
                  @mouseover="showStageTitleButtons = true"
                  @mouseout="showStageTitleButtons = false">
      <v-flex xs10>
        <a @click="showStagePopup(stage)">
          {{ stageName }}
        </a>
      </v-flex>
      <v-flex xs1 v-show="showStageTitleButtons">
        <a @click="$store.dispatch('showAddTopicPopup', stage)">
          <v-icon>add</v-icon>
        </a>
      </v-flex>
      <v-flex xs1 v-show="showStageTitleButtons">
        <a @click="showStagePopup(stage)">
          <v-icon>open_in_new</v-icon>
        </a>
      </v-flex>
    </v-card-title>
    <v-card-text class="flex-card-body">
      <draggable v-model="topics"
                 :options="{group:'stages'}"
                 @change="handleChange"
                 @end="handleDrop"
                 :data-stage-id="stageId"
                 class="draggable">
        <topic v-for="(topicRef, index) in topics"
               :key="index"
               :topicRef="topicRef"
               :stage="stage">
        </topic>
      </draggable>
    </v-card-text>
  </v-card>
</template>

<script>
import draggable from 'vuedraggable';
import TopicComponent from '@/components/Topic'
import { Event } from '@/models';

export default {
  name: 'stage',
  components: {
    draggable,
    Topic: TopicComponent
  },
  props: [
    'index',
    'stage'
  ],
  data: () => ({
    showStageTitleButtons: false,
    // topics: []
  }),
  computed: {
    stageId () {
      if (! this.stage) {
        return;
      }
      return this.stage.id;
    },
    stageName () {
      if (! this.stage) {
        return;
      }
      return this.stage.name;
    },
    // /**
    //  * Only exists so we can watch it with a watcher.
    //  */
    // firestoreTopics () {
    //   // Note: Stage must always have a child topics array, or we will lose messages on drag target
    //   if (! this.stage) {
    //     return;
    //   }
    //   // Warning: it is possible to references in stages[].topics to topics that do not exist in topics collection
    //   // debugger;
    //   return this.$store.state.stages[this.stage.id].topics
    //     .map(topicRef => {
    //       // Only return something if we actually can find the topic
    //       if (topicRef.id in this.$store.state.topics) {
    //         return this.$store.state.topics[topicRef.id];
    //       }
    //     })
    //     // Filter out nulls
    //     .filter(topic => !!topic);
    // },
    // topics: {
    //   get () {
    //     // Note: Stage must always have a child topics array, or we will lose messages on drag target
    //     if (! this.stage) {
    //       return;
    //     }
    //     // Warning: it is possible to references in stages[].topics to topics that do not exist in topics collection
    //     // debugger;
    //     return this.$store.state.stages[this.stage.id].topics
    //       .map(topicRef => {
    //         // Only return something if we actually can find the topic
    //         if (topicRef.id in this.$store.state.topics) {
    //           return this.$store.state.topics[topicRef.id];
    //         }
    //       })
    //       // Filter out nulls
    //       .filter(topic => !!topic);
    //   },
    //   set (topics) {
    //     // debugger;
    //     // this.$store.dispatch('setTopicsInStage', {
    //     //   topics: topics,
    //     //   stage: this.stage
    //     // })
    //     console.log('set topics', this.stage.name, topics);
    //   }
    // }
    topics: {
      get () {
        if (! this.stage) {
          return;
        }
        return this.$store.state.stages[this.stage.id].topics;
      },
      set (topics) {
        // Prevent glitches when drag and dropping
        // We will actually write to Firestore in drop event handler
        this.$store.commit('setTopicsInStage', {topics, stage: this.stage});
      }
    }
  },
  methods: {
    showStagePopup (stage) {
      if (! stage) {
        return;
      }
      this.$store.commit('showStagePopup', stage);
    },
    handleDrop (event) {
      // Warning: Not sure if these ad-hoc objects will cause problems in addEvent
      this.$store.dispatch('addEvent',
        new Event({
          type: 'TOPIC_MOVED',
          topic: { id: event.item.dataset.topicId },
          stage: { id: event.to.dataset.stageId }
        }));

      // TODO if Stage is either 'Done' or 'Cancelled', set Topic.isInPastStage=true

      // TODO instead of handleChange, we should have an atomic operation to move Topic from one Stage to Another
      console.log(event);
      // event.end.from.dataSet.stageId
      // event.end.to.dataSet.stageId
      // event.end.item.dataSet.topicId
      // debugger;
      // console.log('EVENT', event.item);
      this.$store.dispatch('moveTopicById', {
        topicId: event.item.dataset.topicId,
        fromStageId: event.from.dataset.stageId,
        toStageId: event.to.dataset.stageId
      });
    },
    handleChange (event) {
      if (event.added) {
        // We moved topic in to a stage
        // let topicId = event.added.element.id;
        // this.$store.dispatch('addEvent', {type: 'TOPIC_MOVED', to_stage: null});
      } else if (event.removed) {
        // We moved topic out of a stage
      } else if (event.moved) {
        // We changed sort order of a stage
      }

      // console.log(event);
      // this.$store.dispatch('setTopicsInStage', {
      //   topics: this.topics,
      //   stage: this.stage
      // })
    }
  },
  // watch: {
  //   firestoreTopics (newValue) {
  //     this.topics = newValue;
  //   }
  // }
}
</script>

<style>
.stage-column-hidden {
  border: 1px solid red;
  -webkit-transform: rotate(-90deg);
  -moz-transform: rotate(-90deg);
  -ms-transform: rotate(-90deg);
  -o-transform: rotate(-90deg);
}
</style>