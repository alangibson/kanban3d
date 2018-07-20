<template>
  <v-layout column>

    <div>
      {{ aggregates }}
    </div>

    <v-list two-line>
      <span v-for="(topic, topicId, index) in topics">
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ topic.name }}</v-list-tile-title>
            <v-list-tile-sub-title v-if="topic.metrics.lastStageRef">
              <span v-for="(msInterval, stageId, index) in topic.metrics.history">
                {{ stageById(stageId).name }} <v-chip>{{ msFormat(msInterval) }}</v-chip>
              </span>
            </v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-divider></v-divider>
      </span>
    </v-list>
  </v-layout>
</template>

<script>
import moment from 'moment';
import momentDurationFormat from 'moment-duration-format';

export default {
  computed: {
    topics () {
      return this.$store.state.topics;
    },
    aggregates () {
      let agg = {};
      Object.keys(this.$store.state.topics).forEach(topicId => {
        let topic = this.$store.state.topics[topicId];
        Object.keys(topic.metrics.history).forEach(stageId => {
          if (agg[stageId]) {
            agg[stageId] += topic.metrics.history[stageId];
          } else {
            agg[stageId] = topic.metrics.history[stageId];
          }
        });
      });
      return agg;
    }
  },
  methods: {
    stageById (stageId) {

      if (this.$store.state.stages[stageId]) {
        return this.$store.state.stages[stageId];
      } else {
        // HACK avoid exceptions
        return { name: null };
      }
    },
    msFormat (ms) {
      return moment.duration(ms / 1000, 'seconds').format();
    }
  }
}
</script>
