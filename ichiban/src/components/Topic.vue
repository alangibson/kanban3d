<template>
  <v-card :data-topic-id="topic.id"
          class="elevation-2 mb-1">
    <v-card-title @click="showEditTopicPopup(topic)">
      {{ topicName(topic) }}
      <v-chip v-if="countdown">{{countdown}}</v-chip>
    </v-card-title>
  </v-card>
</template>

<script>
import moment from 'moment';
import momentDurationFormat from 'moment-duration-format';

export default {
  props: [
    'topic'
  ],
  data: () => ({
    countdown: null
  }),
  methods: {
    showEditTopicPopup (topic) {
      this.$store.commit('showEditTopicPopup', topic);
    },
    topicName (topic) {
      if (topic) {
        return topic.name;
      }
    }
  },
  mounted () {
    // TODO only need minute resolution
    // TODO stop timer when dropped in 'done' state
    if (this.topic.when) {
      this.$options.interval = setInterval(() => {
        let msLeft = Date.parse(this.topic.when) - new Date().getTime();
        this.countdown = moment.duration(msLeft/1000, 'seconds').format();
      }, 1000);
    }
  },
  beforeDestroy () {
    clearInterval(this.$options.interval);
  }
}
</script>