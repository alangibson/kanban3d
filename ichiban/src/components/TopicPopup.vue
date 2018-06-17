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
              <v-flex xs12
                      v-if="value.stage_name">
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
import Vue from 'vue';
import { clone, TOPIC, STAGE } from '@/common';

import DateTimePicker from '@/components/DateTimePicker';

// Note: VueQuillEditor is globally imported in index.html
import MagicUrl from 'quill-magic-url';
// import DateTimePicker from "./DateTimePicker";
Quill.register('modules/magicUrl', MagicUrl);
Vue.use(VueQuillEditor);

export default {
  components: {
    DateTimePicker
  },
  props: [
    'value'
  ],
  data: () => ({
    dateTimePickerMenu: false,
    pickerDate: null,
    pickerTime: null,
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
    selected_stage_id: null
  }),
  computed: {
    dateTime () {
      let tzOffset = (-(new Date().getTimezoneOffset()/60) + ':00').padStart(5, '0');
      return '' + this.date + 'T' + this.time + '+' + tzOffset;
    },
    date: {
      get () {
        return this.pickerDate;
      },
      set (value) {
        this.pickerDate = value;
        // Warning: side effect
        let tzOffset = (-(new Date().getTimezoneOffset()/60) + ':00').padStart(5, '0');
        this.value.topic.when = '' + value + 'T' + this.time + '+' + tzOffset;
      }
    },
    time: {
      get () {
        return this.pickerTime;
      },
      set (value) {
        this.pickerTime = value;
        // Warning: side effect
        let tzOffset = (-(new Date().getTimezoneOffset()/60) + ':00').padStart(5, '0');
        this.value.topic.when = '' + this.pickerDate + 'T' + value + '+' + tzOffset;
      }
    },
    stages () {
      return this.$store.getters.project.stages;
    },
    selectedStageId: {
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
    },
    showDateTimePicker () {
      console.log('showDateTimePicker');
      this.showDateTimePicker = true;
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