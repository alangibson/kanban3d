<template>
  <v-dialog v-model="value.visible" content-class="stage-popup">
    <v-card height="100%">
      <v-card-title>
        <span class="headline">{{ stage.name }}</span>
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-tile v-for="(topic, index) in stage.topics"
                       :key="index">
            <v-list-tile-content>
              <a @click="showEditTopicPopup(topic, stage)">
                <v-list-tile-title v-html="safeTopic(topic).name"></v-list-tile-title>
              </a>
              <v-list-tile-sub-title v-html="safeTopic(topic).description"></v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn @click="deleteTopic(topic, index)">
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
      return this.value.stage;
    }
  },
  methods: {
    showEditTopicPopup (topic, stage) {
      this.$store.commit('showEditTopicPopup', { topic, stage });
    },
    deleteTopic (topic, topic_index) {
      this.$store.dispatch('deleteTopicFromStage', {stage: this.value.stage, topic: topic, topic_index: topic_index});
      // HACK delete from our stage since it isnt reacting for some reason
      this.value.stage.topics.splice(topic_index, 1);
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