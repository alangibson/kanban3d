<template>
  <v-dialog v-model="value.visible"
            max-width="70vw"
            max-height="10vh"
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
                    required
                    tabindex="1"/>

                <quill-editor v-model="value.topic.description"
                              ref="quillEditor"
                              :options="editor_config">
                </quill-editor>

                <v-layout wrap>
                  <v-flex md4>
                    <v-text-field
                        v-model="value.topic.who"
                        label="Who"
                        tabindex="3"/>
                  </v-flex>
                  <v-flex md4>
                    <v-text-field
                        v-model="value.topic.when"
                        label="When"
                        tabindex="4"/>
                  </v-flex>
                  <v-flex md4>
                    <v-text-field
                      v-model="value.topic.where"
                      label="Where"
                      tabindex="5"/>
                  </v-flex>
                </v-layout>
              </v-flex>
              <v-flex xs12
                      v-if="value.stage_name">
                <v-select
                    label="Stage"
                    required
                    :rules="[requiredRule]"
                    v-model="selectedStage"
                    :items="stages"
                    item-text="name"
                    item-value="id"
                    tabindex="6"/>
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
               @click.native="cancelTopicPopup"
               tabindex="7">
          Close
        </v-btn>
        <v-btn color="blue darken-1"
               flat
               @click.native="saveAndCloseTopicPopup"
               tabindex="8">
          Save and Close
        </v-btn>
        <v-btn color="blue darken-1"
               flat
               @click.native="saveTopicPopup"
               tabindex="9">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Vue from 'vue'
import { clone, TOPIC, STAGE } from '@/common'

// import VueQuillEditor from 'vue-quill-editor'
// Note: VueQuillEditor is globally imported in index.html
// https://cdn.jsdelivr.net/npm/quill-auto-links@0.1.2/dist/index.min.js
// https://cdn.jsdelivr.net/npm/quill-magic-url@0.1.0/dist/index.min.js
// import MagicUrl from 'quill-magic-url'
// import AutoLinks from 'quill-auto-links'
// Quill.register('modules/magicUrl', MagicUrl)
// Quill.register('modules/auto-links', AutoLinks)
Vue.use(VueQuillEditor,
  {
    modules: {
      // magicUrl: true,
      // 'auto-links': true
    }
  }
)

export default {
  props: [
    'value'
  ],
  data: () => ({
    editor_config: {
      theme: 'snow',
      placeholder: "How and Why",
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'font': [] }],
          [{ 'align': [] }],
          ['link', 'image'],
          ['clean']
        ]
      }
    },
    selected_stage_id: null
  }),
  computed: {
    stages () {
      return this.$store.getters.project.stages;
    },
    selectedStage: {
      get () {
        if (! this.selected_stage_id) {
          this.selected_stage_id = this.$store.getters.project.stages[0].id;
        }
        return this.selected_stage_id;
      },
      set (value) {
        this.selected_stage_id = value;
      }
    }
  },
  methods: {
    requiredRule (value) {
      return value !== null && value !== "";
    },
    resetTopicPopup () {
      this.value.topic = clone(TOPIC);
      let stage_name = this.value.stage_name;
      this.$refs.topicForm.reset();
      this.value.stage_name = stage_name;
    },
    saveTopicPopup () {
      // Cancel save if form validation fails
      if (!this.$refs.topicForm.validate()) {
        return;
      }
      // Save new topic
      console.log('this.value.stage', this.value.stage.id);
      this.$store.dispatch('saveTopicToStageById', {
        topic: this.value.topic,
        stage_id: this.selected_stage_id
      });
      this.resetTopicPopup();
    },
    saveAndCloseTopicPopup () {
      this.value.visible = false;
      this.saveTopicPopup();
    },
    cancelTopicPopup () {
      this.value.visible = false;
      this.resetTopicPopup();
    }
  },
  mounted () {
    document.getElementsByClassName("ql-editor")[0].tabIndex = 2;
  }
}
</script>

<style>
.ql-container {
  font-size: 14px;
}
.ql-editor {
  /* Allow typing by clicking anywhere in the editor box */
  height: 30vh;
}
.ql-toolbar {
  z-index: 9999;
}
</style>