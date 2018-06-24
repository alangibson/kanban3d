<template>
  <v-card class="flex-card elevation-4">
    <v-card-title class="subheader">
      <a @click="showStagePopup(stage)">
        {{ stageName }}
      </a>
    </v-card-title>
    <v-card-text class="flex-card-body">
      <draggable v-model="topics"
                 :options="{group:'stages'}"
                 @change="handleChange"
                 @end="handleDrop"
                 :data-stage-id="stageId"
                 class="draggable">

        <topic v-for="(topic, index) in topics"
               :key="index"
               :topic="topic"
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
    topics: {
      get () {
        // Note: Stage must always have a child topics array, or we will lose messages on drag target
        if (! this.stage) {
          return;
        }
        // Warning: it is possible to references in stages[].topics to topics that do not exist in topics collection
        return this.$store.state.stages[this.stage.id].topics
          .map(topicRef => {
            // Only return something if we actually can find the topic
            if (topicRef.id in this.$store.state.topics) {
              return this.$store.state.topics[topicRef.id];
            }
          })
          // Filter out nulls
          .filter(topic => !!topic);
      },
      set (value) {
        this.$store.dispatch('setTopicsInStage', {
          topics: value,
          stage: this.stage
        })
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