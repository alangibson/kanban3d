<template>
  <div>
    <ul>
      <li v-for="(topic, topicId, index) in topics">
        {{ topic.name }}
        <div v-if="topic.metrics.lastStageRef">
          {{ topic.metrics.lastStageRef.id }}
          {{ topic.metrics.lastTimestamp }}
          {{ topic.metrics.history }}
          <ul>
            <li v-for="(msInterval, stageId, index) in topic.metrics.history">
              {{ stageById(stageId).name }} {{ msFormat(msInterval) }}
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import moment from 'moment';
import momentDurationFormat from 'moment-duration-format';

export default {
  computed: {
    topics () {
      return this.$store.state.topics;
    }
  },
  methods: {
    stageById (stageId) {
      return this.$store.state.stages[stageId];
    },
    msFormat (ms) {
      return moment.duration(ms / 1000, 'seconds').format();
    }
  }
}
</script>
