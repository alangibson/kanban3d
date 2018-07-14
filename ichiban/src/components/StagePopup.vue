<template>
  <v-dialog v-model="value.visible" content-class="stage-popup">
    <v-card height="100%">
      <v-card-title>
        <span class="headline">{{ stage.name }}</span>
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-tile v-if="stage.topics"
                       v-for="(topicRef, index) in stage.topics"
                       :key="index">
            <v-list-tile-content>
              <a @click="showEditTopicPopup(topicRef, stage)">
                <v-list-tile-title>{{ topicName(topicRef) }}</v-list-tile-title>
              </a>
              <v-list-tile-sub-title>{{ topicDescription(topicRef) }}</v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn @click="deleteTopic(topicRef, index)">
                <v-icon>delete</v-icon>
              </v-btn>
            </v-list-tile-action>
          </v-list-tile>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: [
    'value'
  ],
  computed: {
    stage () {
      let stage = this.value.stage;
      // TODO don't assume there is a Topic for every TopicRef. Deleting sometimes leaves orphans
      // stage.topics = stage.topics
      //   .map(topicRef => this.$store.state.topics[topicRef.id]);
      return stage;
    }
  },
  methods: {
    topicByTopicRef (topicRef) {
      return this.$store.state.topics[topicRef.id];
    },
    topicName (topicRef) {
      let topic = this.topicByTopicRef(topicRef);
      if (topic)
        return topic.name;
    },
    topicDescription (topicRef) {
      let topic = this.topicByTopicRef(topicRef);
      if (topic)
        return topic.description;
    },
    showEditTopicPopup (topicRef, stage) {
      let topic = this.topicByTopicRef(topicRef);
      this.$store.commit('showEditTopicPopup', { topic, stage });
    },
    deleteTopic (topicRef, topicIndex) {
      this.$store.dispatch('deleteTopicFromStage', {stage: this.value.stage, topicRef: topicRef, topic_index: topicIndex});
      // HACK delete from our stage since it isnt reacting for some reason
      this.value.stage.topics.splice(topicIndex, 1);
    },
    safeTopic (topic) {
      // HACK because there are nulls in stage.topic when it is out of sync with topics collection
      if (!topic) {
        return {name:null, description:null}
      }
    }
  }
}
</script>

<style>
.stage-popup {
  /*max-width: 50vw;*/
  height: 90vh;
}
</style>