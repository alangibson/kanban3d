<template>
  <v-dialog v-model="value.visible"
            max-width="50vw">
    <v-card>
      <v-card-title>
        <span class="headline">Project</span>
      </v-card-title>
      <v-card-text>
        <v-container grid-list-md>
          <v-form ref="projectForm">
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field
                    v-model="value.project.name"
                    label="Name"
                    autofocus
                    :rules="[requiredRule]"
                    required />
              </v-flex>
            </v-layout>
          </v-form>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1"
               flat
               @click.native="cancelPopup">
          Cancel
        </v-btn>
        <v-btn color="blue darken-1"
               flat
               @click.native="saveAndClosePopup">
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { clone, PROJECT } from '@/common';

export default {
  props: [
    'value'
  ],
  computed: {
  },
  methods: {
    requiredRule (value) {
      return value !== null && value !== "";
    },
    resetPopup () {
      this.value.project = clone(PROJECT);
      // let stage_name = this.value.stage_name;
      this.$refs.projectForm.reset();
      // this.value.stage_name = stage_name;
    },
    savePopup () {
      // Cancel save if form validation fails
      if (!this.$refs.projectForm.validate()) {
        return;
      }
      // Save new topic
      this.$store.dispatch('newProject', this.value.project);
      this.resetPopup();
    },
    saveAndClosePopup () {
      this.value.visible = false;
      this.savePopup();
    },
    cancelPopup () {
      this.value.visible = false;
      this.resetPopup();
    }

  }
}
</script>