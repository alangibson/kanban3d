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
                <v-list-tile-title v-html="topic.name"></v-list-tile-title>
              </a>
              <v-list-tile-sub-title v-html="topic.description"></v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn @click="deleteTopicFromStageByIndex(index)">
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
    deleteTopicFromStageByIndex (index) {
      this.$store.dispatch('deleteTopicFromStageByIndex', {stage: this.value.stage, topic_index: index});
      // HACK delete from our stage since it isnt reacting for some reason
      this.value.stage.topics.splice(index, 1);
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