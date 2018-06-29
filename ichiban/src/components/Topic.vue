<template>
  <v-card :data-topic-id="topicRef.id"
          class="topic elevation-2 mb-1">
    <v-card-title @click="showEditTopicPopup">
      {{ topicName(topic) }}
      <v-chip v-if="topic"
              v-for="(tag, index) in topic.tags"
              small>
        {{tag}}
      </v-chip>
      <v-chip v-if="countdown" small>{{countdown}}</v-chip>
    </v-card-title>
  </v-card>
</template>

<script>
import moment from 'moment';
import ColorHash from 'color-hash';
import momentDurationFormat from 'moment-duration-format';
import { Topic } from '@/models';

export default {
  props: [
    'topicRef',
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
        return topic.sanitizedName;
      }
    },
    tagColor (tag) {
      console.log(new ColorHash().hex(tag));
      return new ColorHash().hex(tag);
    }
  },
  computed: {
    topic () {
      let topic = this.$store.state.topics[this.topicRef.id];
      if (topic) {
        return topic;
      } else {
        // TODO return a real Topic object
        return { topics: [] }
      }
    }
  },
  created () {
    // TODO only need minute resolution
    // TODO stop timer when dropped in 'done' stat
    if (this.topic && this.topic.when) {
      this.$options.interval = setInterval(() => {
        let msLeft = Date.parse(this.topic.when) - new Date().getTime();
        if (msLeft <= 0) {
          this.countdown = '00:00';
          clearInterval(this.$options.interval);
        } else {
          this.countdown = moment.duration(msLeft/1000, 'seconds').format();
        }
      }, 1000);
    }
  },
  watch: {
    topic: {
      deep: true,
      handler: function (value) {
        // Kill earlier timer in case we are reloading
        clearInterval(this.$options.interval);
        // this.countdown = null;
        // Start new timer
        // TODO only need minute resolution
        // TODO stop timer when dropped in 'done' state
        if (this.topic && this.topic.when && this.topic.when !== '') {
          this.$options.interval = setInterval(() => {
            let msLeft = Date.parse(this.topic.when) - new Date().getTime();
            if (msLeft <= 0) {
              this.countdown = '00:00';
              clearInterval(this.$options.interval);
            } else {
              this.countdown = moment.duration(msLeft/1000, 'seconds').format();
            }
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