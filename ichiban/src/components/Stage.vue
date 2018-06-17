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
                 :data-stage-index="index"
                 :data-stage-id="stageId"
                 class="draggable">

        <topic v-for="(topic, index) in topics"
               :key="index"
               :topic="topic">
        </topic>

      </draggable>
    </v-card-text>
  </v-card>
</template>

<script>
import draggable from 'vuedraggable';
import { clone, TOPIC } from '@/common';
import Topic from '@/components/Topic'

export default {
  name: 'stage',
  components: {
    draggable,
    Topic
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
        // Note: Stage must always have a child topics array, or we will loose messages on drag target
        if (! this.stage) {
          return;
        }
        console.log('rerender topics', this.stage.name, this.stage.id);
        return this.$store.state.stages[this.stage.id].topics
          .map(topicRef => this.$store.state.topics[topicRef.id]);
      },
      set (value) {
        console.log('topics set', this.stage.name, value);
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
      this.$store.dispatch('addEvent', {
        type: 'TOPIC_MOVED',
        topicId: event.item.dataset.topicId,
        fromStageIndex: event.from.dataset.stageIndex,
        toStageIndex: event.to.dataset.stageIndex,
        createdAt: new Date()
      });
    },
    handleChange (event) {
      if (event.added) {
        // We moved topic in to a stage
        console.log('added', JSON.stringify(event.added.element.id));
        let topicId = event.added.element.id;
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