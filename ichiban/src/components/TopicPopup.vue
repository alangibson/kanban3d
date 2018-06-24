<template>
  <v-dialog v-model="isVisible"
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
                    <v-menu
                        ref="dateTimePickerMenu"
                        :close-on-content-click="false"
                        v-model="dateTimePickerMenu"
                        :nudge-right="40"
                        :nudge-up="60"
                        :return-value.sync="date"
                        lazy
                        transition="scale-transition"
                        offset-y
                        full-width
                        min-width="290px">
                      <v-text-field
                          slot="activator"
                          v-model="value.topic.when"
                          @click="showDateTimePicker"
                          label="When"
                          tabindex="4"
                          prepend-icon="event">
                      </v-text-field>
                      <!-- Combined date and time picker menu -->
                      <div>
                        <v-layout row>
                          <v-flex>
                            <v-date-picker v-model="date" scrollable></v-date-picker>
                          </v-flex>
                          <v-flex>
                            <v-time-picker v-model="time" format="24hr"></v-time-picker>
                          </v-flex>
                        </v-layout>
                        <!--TODO scoped OK and cancel buttons -->
                        <!--<v-layout row>-->
                          <!--<v-flex>-->
                            <!--<v-btn flat color="primary" @click="dateTimePickerMenu = false">Cancel</v-btn>-->
                            <!--<v-btn flat color="primary" @click="$refs.dateTimePickerMenu.save(date)">OK</v-btn>-->
                          <!--</v-flex>-->
                        <!--</v-layout>-->
                      </div>

                    </v-menu>
                  </v-flex>

                  <v-flex md4>
                    <v-text-field
                      v-model="value.topic.where"
                      label="Where"
                      tabindex="5"/>
                  </v-flex>
                </v-layout>
              </v-flex>
              <v-flex xs12>
                <v-select
                    label="Stage"
                    required
                    :rules="[requiredRule]"
                    v-model="selectedStageId"
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
               @click.native="closeTopicPopup"
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
               @click.native="saveAndNewTopicPopup"
               tabindex="9">
          Save and New
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import Vue from 'vue';
import { Topic } from '@/models';

// Note: VueQuillEditor is globally imported in index.html
import MagicUrl from 'quill-magic-url';
Quill.register('modules/magicUrl', MagicUrl);
Vue.use(VueQuillEditor);

function datetimeStringToDate (iso8601String) {
  if (iso8601String) {
    console.log('datetimeStringToDate', iso8601String.substring(0, 10));
    return iso8601String.substring(0, 10);
  }
}

function datetimeStringToTime (iso8601String) {
  if (iso8601String) {
    console.log('datetimeStringToTime', iso8601String.substring(11, 29));
    return iso8601String.substring(11, 29);
  }
}

export default {
  props: [
    'value'
  ],
  data: function () { return {
    dateTimePickerMenu: false,
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
        ],
        magicUrl: true
      }
    },
    selectedStage: null
  }},
  computed: {
    isVisible: {
      get () {
        // if (this.value.visible) {
        //   // We have been opened
        // } else {
        //   // We have been closed
        // }
        return this.value.visible;
      },
      set (value) {
        this.value.visible = value;
      }
    },
    date: {
      get () {
        if (! this.value.topic.when || this.value.topic.when === '') {
          return datetimeStringToDate(new Date().toISOString());
        } else {
          return datetimeStringToDate(this.value.topic.when);
        }
      },
      set (value) {
        // Warning: side effect
        // let tzOffset = (-(new Date().getTimezoneOffset()/60) + ':00').padStart(5, '0');
        // this.value.topic.when = '' + value + 'T' + this.time + '+' + tzOffset;
        this.value.topic.when = '' + value + 'T' + this.time;
      }
    },
    time: {
      get () {
        if (! this.value.topic.when || this.value.topic.when === '') {
          return datetimeStringToTime(new Date().toISOString());
        } else {
          return datetimeStringToTime(this.value.topic.when);
        }
      },
      set (value) {
        // Add time zone and seconds because these are not provided by the time picker
        let tzOffset = (-(new Date().getTimezoneOffset()/60) + ':00').padStart(5, '0');
        // Warning: side effect
        this.value.topic.when = '' + this.date + 'T' + value + ':00+' + tzOffset;
        // this.value.topic.when = '' + this.date + 'T' + value;

      }
    },
    stages () {
      if (this.$store.getters.project) {
        return this.$store.getters.project.stages;
      } else {
        return [];
      }
    },
    selectedStageId: {
      cache: false,
      get () {
        if (this.selectedStage) {
          return this.selectedStage.id;
        } else if (this.value.stage) {
          // this.selectedStage = this.value.stage;
          return this.value.stage.id;
        } else if (this.$store.getters.project && this.$store.getters.project.stages[0]) {
          // Fall back to first stage
          // Warning: side effect
          // this.selectedStage = this.$store.getters.project.stages[0];
          // Set selected stage from default stage
          return this.$store.getters.project.stages[0].id;
        }
      },
      set (value) {
        this.selectedStage = this.$store.state.stages[value];
      }
    },
    stage () {
      if (this.selectedStage) {
        return this.selectedStage;
      } else if (this.value.stage) {
        return this.value.stage;
      } else if (this.$store.getters.project && this.$store.getters.project.stages[0]) {
        // Fall back to first stage
        return this.$store.getters.project.stages[0];
      }
    }
  },
  methods: {
    requiredRule (value) {
      return value !== null && value !== "";
    },
    resetTopicPopup () {
      this.value.topic = new Topic();
      this.$refs.topicForm.reset();
      this.selectedStage = null;
    },
    saveTopicPopup () {
      // Cancel save if form validation fails
      if (!this.$refs.topicForm.validate()) {
        return;
      }
      // Save new topic
      this.$store.dispatch('saveTopicToStage', {
        topic: this.value.topic,
        stage: this.stage
      });
    },
    saveAndNewTopicPopup () {
      this.saveTopicPopup();
      // Reset popup, preserving selected stage
      let selectedStage = this.selectedStage;
      this.resetTopicPopup();
      this.selectedStage = selectedStage;
    },
    saveAndCloseTopicPopup () {
      this.value.visible = false;
      this.saveTopicPopup();
      this.resetTopicPopup();
    },
    closeTopicPopup () {
      this.value.visible = false;
      this.resetTopicPopup();
    },
    showDateTimePicker () {
      this.showDateTimePicker = true;
    }
  },
  mounted () {
    document.getElementsByClassName("ql-editor")[0].tabIndex = 2;

    // if (! this.selectedStage && this.$store.getters.project && this.$store.getters.project.stages[0]) {
    //   this.selectedStage = this.$store.getters.project.stages[0];
    // }
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