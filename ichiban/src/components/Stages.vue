<template>
  <div id="stages-container" style="margin: 0; padding: 0;">
    <v-layout row
              :class="rowClass(index)"
              v-for="(s, index) in rowChunks()"
              :key="index">
      <v-flex v-for="index in s"
              :class="colClass(index)"
              :key="index">
        <stage :index="index"
               :class="colClass(index)"
               :stageRef="stageRefByIndex(index)">
        </stage>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import Stage from '@/components/Stage.vue';

export default {
  components: {
    Stage
  },
  computed: {
    stageRefs () {
      let project = this.$store.state.projects[this.$store.state.activeProjectId];
      if (project)
        return project.stages;
    }
  },
  methods: {
    stageByIndex (index) {
      if (! this.stageRefs) {
        return;
      }
      let stageRef = this.stageRefs[index];
      let stage = this.$store.state.stages[stageRef.id];
      return stage;
    },
    stageRefByIndex (index) {
      // let project = this.$store.state.projects[this.$store.state.activeProjectId];
      // let stageRef = this.project.stages[index];
      if (! this.stageRefs)
        return;
      let stageRef = this.stageRefs[index];
      return stageRef;
    },
    rowClass (row_index) {
      if (row_index === 0 && this.$store.state.show.row_state === 10) {
        return 'flex-row-minimized'
      } else if (row_index === 1 && this.$store.state.show.row_state === 1) {
        return 'flex-row-minimized'
      } else if (this.$store.state.show.row_state === 0 || this.$store.state.show.row_state === 11) {
        return 'flex-row'
      }
      return 'flex-row-maximized'
    },
    colClass (index) {
      if ((index === 0 || index === 4) && ! this.$store.state.show.future) {
        return 'flex-item-hidden';
      } else if ((index === 1 || index === 2 || index === 5 || index === 6 ) && ! this.$store.state.show.present) {
        return 'flex-item-hidden';
      } else if ((index === 3 || index === 7) && ! this.$store.state.show.past) {
        return 'flex-item-hidden';
      }
      return 'flex-item';
    },
    rowChunks () {
      if (! this.stageRefs) {
        return;
      }
      // [[0,1,2,3], [4,5,6,7]]
      return _.chunk(_.range(this.stageRefs.length), 4);
    }
  }
}
</script>

<style>
.flex-row {
  height: 49vh !important;
}
.flex-row-minimized {
  height: 5vh !important;
}
.flex-row-minimized .topic {
  display: none;
}
.flex-row-minimized .stage .flex-card-body {
  height: 50px !important;
  overflow: hidden;
}
.flex-row-maximized {
  height: 80vh !important;
}
.flex-item {
  flex: 1 !important;
}

.flex-item-hidden {
  min-width: 5ch;
  flex: 0 !important;
  overflow: hidden;
}
.flex-item-hidden .card__title.subheader {
  -webkit-transform: rotate(90deg);
  -moz-transform: rotate(90deg);
  -ms-transform: rotate(-90deg);
  -o-transform: rotate(-90deg);
}
.flex-item-hidden .topic {
  display: none;
}

.flex-card {
  height: 100% !important;
  overflow: hidden;
}
.flex-card-body {
  /*height: 93% !important;*/
  height: 93%;
  overflow-y: auto;
}
</style>