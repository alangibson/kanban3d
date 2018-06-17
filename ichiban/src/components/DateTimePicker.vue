<template>
  <v-date-picker v-model="date" no-title scrollable></v-date-picker>
</template>

<script>
export default {
  data: () => ({
    date: null
  }),
  computed: {
    get () {
      return this.date;
    },
    set (value) {
      console.log('new date', value);
      this.date = value;
    }
  },
  mounted () {
    console.log('PICKER')
  }
}
</script>