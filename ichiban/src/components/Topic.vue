<template>
  <v-card :data-topic-id="topicRef.id"
          class="topic elevation-2 mb-1">
    <v-card-title @click="showEditTopicPopup">
      {{ topicName(topic) }}
      <v-chip v-if="topic && topic.interval" small>{{topic.countdown}}</v-chip>
      <v-chip v-if="topic"
              v-for="(tag, index) in topicTags(topic)"
              small>
        {{tag}}
      </v-chip>
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
    topicTags (topic) {
      if (topic && topic.tags) {
        return topic.tags;
      } else {
        return [];
      }
    },
    tagColor (tag) {
      return new ColorHash().hex(tag);
    },
    // clearTimer () {
    //   clearInterval(this.$options.interval);
    // },
    // startTimer () {
    //   this.$options.interval = setInterval(() => {
    //     let msLeft = Date.parse(this.topic.when) - new Date().getTime();
    //     if (msLeft <= 0) {
    //       this.countdown = '00:00';
    //       this.clearTimer();
    //     } else {
    //       this.countdown = moment.duration(msLeft/1000, 'seconds').format();
    //     }
    //   }, 1000);
    // }
  },
  computed: {
    topic () {
      let topic = this.$store.state.topics[this.topicRef.id];
      if (topic)
        return topic;
      else
        console.warn('No Topic found for TopicRef', this.topicRef.path);
    }
  },
  // created () {
    // TODO only need minute resolution
    // TODO stop timer when dropped in 'done' stat
    // if (this.topic && this.topic.when) {
    //   // this.startTimer();
    //   // this.topic.startTimer();
    // }
  // },
  // watch: {
  //   topic: {
  //     deep: true,
  //     handler: function (value) {
  //       // Kill earlier timer in case we are reloading
  //       this.clearTimer();
  //       // this.countdown = null;
  //       // Start new timer
  //       // TODO only need minute resolution
  //       // TODO stop timer when dropped in 'done' state
  //       if (this.topic && this.topic.when && this.topic.when !== '') {
  //         this.startTimer();
  //       }
  //     }
  //   }
  // },
  // beforeDestroy () {
  //   this.clearTimer();
  // }
}
</script>