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
      <draggable v-model="topicsRefs"
                 :options="{group:'stages'}"
                 @change="handleChange"
                 @end="handleDrop"
                 :data-stage-id="stageId"
                 class="draggable">
        <topic v-for="(topicRef, index) in topicsRefs"
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
    'stageRef'
  ],
  data: () => ({
    showStageTitleButtons: false
  }),
  computed: {
    stage () {
      if (! this.stageRef)
        return;
      return this.$store.state.stages[this.stageRef.id];
    },
    stageId () {
      if (! this.stageRef)
        return;
      return this.stageRef.id;
    },
    stageName () {
      if (! this.stage)
        return;
      return this.stage.name;
    },
    topicsRefs: {
      get () {
        // TODO we are getting Stage objects, but then getting StageRefs from store state.
        // Can we just keep full Stage object everywhere?

        // console.log('topics', this.stage.topics.length, this.$store.state.stages[this.stage.id]);
        if (! this.stage)
          return;
        return this.stage.topics;
        // if (! this.stage) {
        //   return;
        // }
        // return this.stage.topics;
      },
      set (topicRefs) {
        // Prevent glitches when drag and dropping
        // We will actually write to Firestore in drop event handler
        this.$store.commit('setTopicRefsInStageByStageRef', {topicRefs: topicRefs, stageRef: this.stageRef});
      }
    }
  },
  methods: {
    showStagePopup (stage) {
      if (! stage)
        return;
      this.$store.commit('showStagePopup', stage);
    },
    handleDrop (event) {
      // Warning: Not sure if these ad-hoc objects will cause problems in addEvent
      // this.$store.dispatch('addEvent',
      //   new Event({
      //     type: 'TOPIC_MOVED',
      //     topic: { id: event.item.dataset.topicId },
      //     stage: { id: event.to.dataset.stageId }
      //   }));

      // TODO if Stage is either 'Done' or 'Cancelled', set Topic.isInPastStage=true

      // TODO instead of handleChange, we should have an atomic operation to move Topic from one Stage to Another
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
    }
  }
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