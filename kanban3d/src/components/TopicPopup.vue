<template>
  <v-dialog v-model="value.visible"
            max-width="50vw"
            :hide-overlay="true">
    <v-card>
      <v-card-title>
        <span class="headline">Topic</span>
      </v-card-title>
      <v-card-text>
        <v-container grid-list-md>
          <v-form ref="topicForm">
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field
                    v-model="value.topic.name"
                    label="What"
                    autofocus
                    :rules="[requiredRule]"
                    required />

                <!--<v-text-field-->
                <!--v-model="add_topic_popup.topic.description"-->
                <!--label="How and Why"-->
                <!--multi-line-->
                <!--rows="7"/>-->
                <froala v-model="value.topic.description"
                        :config="froala_config">
                </froala>

                <v-text-field
                    v-model="value.topic.who"
                    label="Who" />
                <v-text-field
                    v-model="value.topic.when"
                    label="When" />
                <v-text-field
                    v-model="value.topic.where"
                    label="Where" />
              </v-flex>
              <v-flex xs12>
                <v-select
                    label="Stage"
                    required
                    :rules="[requiredRule]"
                    v-model="value.stage_name"
                    :items="stages"
                    item-text="name"
                    item-value="name" />
              </v-flex>
            </v-layout>
          </v-form>
        </v-container>
        <small>*indicates required field</small>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1"
               flat
               @click.native="cancelTopicPopup">
          Close
        </v-btn>
        <v-btn color="blue darken-1"
               flat
               @click.native="saveAndCloseTopicPopup">
          Save and Close
        </v-btn>
        <v-btn color="blue darken-1"
               flat
               @click.native="saveTopicPopup">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import uuid from 'uuid/v4'
import { clone, TOPIC, STAGE } from '@/common'

export default {
  props: [
    'value',
    'stages'
  ],
  data: () => ({
    froala_config: {
      toolbarInline: true,
      charCounterCount: false,
      height: '30vh',
      toolbarButtons: ['bold', 'italic', 'underline', 'strikeThrough', 'color', 'emoticons', '-', 'paragraphFormat',
        'align', 'formatOL', 'formatUL', 'indent', 'outdent', '-', 'insertImage', 'insertLink', 'insertFile',
        'insertVideo', 'undo', 'redo'],
      editorClass: 'froala-editor-box',
      placeholderText: 'How and Why',
      zIndex: 666
    }
  }),
  methods: {
    requiredRule (value) {
      return value !== null && value !== ""
    },
    resetTopicPopup () {
      this.value.topic = clone(TOPIC)
      let stage_name = this.value.stage_name
      this.$refs.topicForm.reset()
      this.value.stage_name = stage_name
    },
    saveTopicPopup () {
      // Cancel save if form validation fails
      if (!this.$refs.topicForm.validate()) {
        return
      }
      // Save new topic
      let newTopic = clone(this.value.topic)
      newTopic.id = uuid()
      // Even though we loop over all stages, a topic can only be in 1 stage
      this.stages.forEach((stage) => {
        if (stage.name === this.value.stage_name) {
          stage.topics.unshift(newTopic)
        }
      })

      // FIXME Call this on parent?
      // this.saveStagesToFirebase()

      this.resetTopicPopup()
    },
    saveAndCloseTopicPopup () {
      this.value.visible = false
      this.saveTopicPopup()
    },
    cancelTopicPopup () {
      this.value.visible = false
      this.resetTopicPopup()
    }
  }
}
</script>