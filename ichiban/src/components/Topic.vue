<template>
  <v-card :data-topic-id="topic.id"
          class="topic elevation-2 mb-1">
    <v-card-title @click="showEditTopicPopup">
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
    'topic',
    'stage'
  ],
  data: () => ({
    countdown: null
  }),
  methods: {
    showEditTopicPopup () {
      this.$store.commit('showEditTopicPopup', { topic: this.topic, stage: this.stage });
    },
    topicName (topic) {
      if (topic) {
        return topic.name;
      }
    }
  },
  mounted () {
    // TODO only need minute resolution
    // TODO stop timer when dropped in 'done' stat
    if (this.topic && this.topic.when) {
      this.$options.interval = setInterval(() => {
        let msLeft = Date.parse(this.topic.when) - new Date().getTime();
        this.countdown = moment.duration(msLeft/1000, 'seconds').format();
      }, 1000);
    }
  },
  watch: {
    topic: {
      deep: true,
      handler: function (value) {
        // Kill earlier timer in case we are reloading
        clearInterval(this.$options.interval);
        this.countdown = null;
        // Start new timer
        // TODO only need minute resolution
        // TODO stop timer when dropped in 'done' state
        if (this.topic && this.topic.when && this.topic.when !== '') {
          this.$options.interval = setInterval(() => {
            let msLeft = Date.parse(this.topic.when) - new Date().getTime();
            this.countdown = moment.duration(msLeft/1000, 'seconds').format();
          }, 1000);
        }
      }
    }
  },
  beforeDestroy () {
    clearInterval(this.$options.interval);
  }
}
</script>