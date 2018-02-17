<template>
  <v-layout class="flex-calendar">
    <v-flex v-for="day in calendar"
            class="flex-day"
            @click="showAddTimePopup(day)">
      {{ day.start.toLocaleString(DateTime.DATE_SHORT) }}
      <template v-for="timeBlock in timeBlocks">
        <v-flex v-if="day.start.ts < timeBlock.start.ts && timeBlock.start.ts < day.end.ts"
                class="flex-day"
                style="background-color: red">
          {{timeBlock.start.toLocaleString(DateTime.TIME_24_SIMPLE)}} -
          {{timeBlock.end.toLocaleString(DateTime.TIME_24_SIMPLE)}}
        </v-flex>
      </template>
    </v-flex>

    <v-dialog v-model="add_time_popup.visible"
              max-width="700px">
      <v-card>
        <v-card-title>
          <span class="headline">Add Time</span>
        </v-card-title>
        <v-card-text>
          <v-container grid-list-md>
            <v-form ref="addTopicForm">
              <v-layout wrap>
                <v-flex xs12>
                  <v-text-field
                      v-model="add_time_popup.name"
                      label="Name"
                      autofocus
                      required />
                </v-flex>

                <v-flex xs12>
                  Starts
                </v-flex>
                <v-flex xs6>
                  <v-menu
                      ref="menu_start_date"
                      lazy
                      :close-on-content-click="true"
                      v-model="menu_start_date"
                      transition="scale-transition"
                      offset-y
                      full-width
                      :nudge-right="40"
                      min-width="290px">
                    <v-text-field
                        slot="activator"
                        label="Start Date"
                        v-model="add_time_start_date"
                        prepend-icon="event"
                        readonly />
                    <v-date-picker
                        ref="picker_start_date"
                        v-model="add_time_start_date"
                        @input="updateAddTimeStartTs"/>
                  </v-menu>
                </v-flex>
                <v-flex xs6>
                  <v-menu
                      ref="menu"
                      lazy
                      :close-on-content-click="true"
                      v-model="menu_start_time"
                      transition="scale-transition"
                      offset-y
                      full-width
                      :nudge-right="40"
                      min-width="290px">
                    <v-text-field
                        slot="activator"
                        label="Start Time"
                        v-model="add_time_start_time"
                        prepend-icon="event"
                        readonly />
                    <v-time-picker
                        @input="updateAddTimeStartTs"
                        v-model="add_time_start_time"
                        format="24hr"/>
                  </v-menu>
                </v-flex>

                <v-flex xs12>
                  Ends
                </v-flex>
                <v-flex xs12>
                  <v-text-field
                      v-model="add_time_duration_hours"
                      label="Duration Hours"/>
                </v-flex>
                <v-flex xs12>
                  or
                </v-flex>
                <v-flex xs6>
                  <v-menu
                      ref="menu"
                      lazy
                      :close-on-content-click="true"
                      v-model="menu_end_date"
                      transition="scale-transition"
                      offset-y
                      full-width
                      :nudge-right="40"
                      min-width="290px">
                    <v-text-field
                        slot="activator"
                        label="Start At"
                        v-model="add_time_popup.end.ts_date"
                        prepend-icon="event"
                        readonly />
                    <v-date-picker
                        ref="picker"
                        v-model="add_time_popup.end.ts_date"
                        @input="updateAddTimeStartTs"
                        min="1950-01-01"
                        :max="new Date().toISOString().substr(0, 10)"/>
                  </v-menu>
                </v-flex>
                <v-flex xs6>
                  <v-menu
                      ref="menu"
                      lazy
                      :close-on-content-click="true"
                      v-model="menu_end_time"
                      transition="scale-transition"
                      offset-y
                      full-width
                      :nudge-right="40"
                      min-width="290px">
                    <v-text-field
                        slot="activator"
                        label="Start At"
                        v-model="add_time_popup.end.ts_time"
                        prepend-icon="event"
                        readonly />
                    <v-time-picker
                        @input="updateAddTimeStartTs"
                        v-model="add_time_popup.end.ts_time"
                        format="24hr"/>
                  </v-menu>
                </v-flex>

                <v-flex xs12>
                  Recurs every
                </v-flex>
                <v-flex xs6>
                  <v-text-field
                      @input="updateAddTimeRecurs"
                      v-model="add_time_popup.recurs.qty" />
                </v-flex>
                <v-flex xs6>
                  <v-select
                      label=""
                      @input="updateAddTimeRecurs"
                      v-model="add_time_popup.recurs.unit"
                      :items="['days', 'weeks', 'months', 'years']"
                      item-text="recurs"
                      item-value="recurs" />
                </v-flex>
                <v-flex xs12>
                  add_time_start_date={{ add_time_start_date }}
                  add_time_start_time={{ add_time_start_time }}
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
                 @click.native="cancelAddTimePopup">
            Close
          </v-btn>
          <v-btn color="blue darken-1"
                 flat
                 @click.native="saveAndCloseAddTimePopup">
            Save and Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-layout>
</template>

<script>
import { DateTime } from 'luxon'

function clone(o) {
  return JSON.parse(JSON.stringify(o))
}

// Yields DateTime objects
function* timeBlocks(block, untilOverride) {
  // Initialize start time
  let startAt = null
  if (! block.start.ts) {
    console.warn('No start time. Falling back to Now')
    startAt = DateTime.local()
  } else {
    console.log('Start time is', block.start.ts)
    startAt = DateTime.fromISO(block.start.ts)
  }

  // Initialize end time
  let endAt = null
  if ('duration' in block.end) {
    endAt = startAt.plus(block.end.duration)
    console.log('end at now', endAt.toISO(), 'after duration', JSON.stringify(block.end.duration))
  } else if (! block.end.ts) {
    console.warn('No end time. Falling back to Now')
    endAt = DateTime.local()
  } else {
    endAt = DateTime.fromISO(block.end.ts)
  }

  // Figure out until datetime
  let until = block.until
  if (untilOverride) {
    until = untilOverride
  }
  let untilDate = null
  if (until === null) {
    console.warn('No until date set')
  } else if ('duration' in until) {
    until.ts = startAt.plus(until.duration)
    untilDate = DateTime.fromISO(until.ts)
  } else {
    untilDate = DateTime.fromISO(until.ts)
  }

  // Now loop forward in time until block.until is reached
  while (true) {
    // Apply time limit
    // TODO when we include endAt, the last day of the month is chopped off
    // if (untilDate && ( startAt.ts > untilDate.ts || endAt.ts > untilDate.ts ) ) {
    if (untilDate && ( startAt.ts > untilDate.ts ) ) {
      console.log('Aborting because no untilDate or startAt.ts', startAt.toISO(), '> untilDate.ts', untilDate.toISO())
      return
    }

    yield {start: startAt, end: endAt, until: untilDate}

    // Avoid infinite loop if no block.recurs
    if (! block.recurs) {
      console.log('Aborting because no block.recurs')
      return
    }

    // Get ready for next loop
    console.log('Start', startAt.toISO(), 'and end at', endAt.toISO(), 'recurs in', JSON.stringify(block.recurs))
    startAt = startAt.plus(block.recurs)
    endAt = endAt.plus(block.recurs)
  }
}

export default {
  data: () => ({
    DateTime: DateTime,

    menu_start_date: false,
    menu_start_time: false,
    menu_end_date: false,
    menu_end_time: false,

    add_time_popup: {
      visible: false,
      name: null,
      start: {
        ts: null,
        ts_date: null,
        ts_time: null
      },
      end: {
        ts: null,
        ts_date: null,
        ts_time: null,
        duration: {
          hours: null
        }
      },
      recurs: {
        qty: null,
        unit: null
      }
    },
    blocks: [
      {
        start:  { ts: "2018-02-03T08:00:00.000+00:00" },
        end:    { duration: { hours: 7.7 } },
        recurs: { weeks: 1 },
        until:  null
      }
    ],
    calendarBlock: {
      start:  { ts: DateTime.local().startOf('month').startOf('week').toISO() },
      end:    { duration: { hours: 24 } },
      recurs: { days: 1 },
      // until:  { duration: { months: 1 } }
      until: { ts: DateTime.local().endOf('month').toISO() }
    }
  }),
  methods: {
    showAddTimePopup(day) {
      // FIXME start.ts is string and day.start.ts is int in DateTime
      this.add_time_popup.start.ts = day.start.toISO()
      this.add_time_popup.recurs =  {
        qty: null,
        unit: null
      }
      this.add_time_popup.visible = true
    },
    updateAddTimeStartTs() {
      // this.add_time_popup.start.ts = DateTime.fromISO(this.add_time_popup.start.ts_date + 'T' + this.add_time_popup.start.ts_time).toISO()
    },
    updateAddTimeRecurs() {
      console.log('updateAddTimeRecurs', this.add_time_popup.recurs.unit, this.add_time_popup.recurs.qty)
      this.add_time_popup.recurs[this.add_time_popup.recurs.unit] = parseInt(this.add_time_popup.recurs.qty)
    },
    cancelAddTimePopup() {
    },
    saveAndCloseAddTimePopup() {
      let block = clone({
        start:  { ts: this.add_time_popup.start.ts },
        end:    {
          ts: this.add_time_popup.end.ts,
          duration: this.add_time_popup.end.duration
        },
        recurs: this.add_time_popup.recurs,
        until:  this.add_time_popup.until
      })
      console.log('saveAndCloseAddTimePopup', JSON.stringify(block))

      // HACK
      delete block.recurs.qty
      delete block.recurs.unit
      delete block.recurs.null

      this.blocks.push(block)
    }
  },
  computed: {
    calendar() {
      let days = []
      for (let day of timeBlocks(this.calendarBlock)) {
        days.push(day)
      }
      return days
    },
    timeBlocks() {
      let untilOverride = {duration: { months: 1 }}
      let days = []
      this.blocks.forEach((block) => {
        console.log('timeBlocks block', JSON.stringify(block))
        for (let day of timeBlocks(block, untilOverride)) {
          console.log('timeBlocks day', JSON.stringify(day))
          days.push(day)
        }
      })
      return days
    },
    add_time_start_date: {
      get() {
        // Note: must be in yyyy-mm-dd format
        return DateTime.fromISO(this.add_time_popup.start.ts).toFormat('yyyy-MM-dd')
      },
      set(date_string) {
        let datetime = DateTime.fromISO(date_string)
        this.add_time_popup.start.ts =
          DateTime.fromISO(this.add_time_popup.start.ts).set({
            year: datetime.year,
            month: datetime.month,
            day: datetime.day
          }).toISO()
      }
    },
    add_time_start_time: {
      get() {
        return DateTime.fromISO(this.add_time_popup.start.ts).toLocaleString(DateTime.TIME_24_WITH_SECONDS)
      },
      set(time_string) {
        let datetime = DateTime.fromISO(time_string)
        this.add_time_popup.start.ts =
          DateTime.fromISO(this.add_time_popup.start.ts).set({
            hour: datetime.hour,
            minute: datetime.minute,
            second: 0
          }).toISO()
      }
    },
    add_time_duration_hours: {
      get() {
        return this.add_time_popup.end.duration.hours
      },
      set(value) {
        this.add_time_popup.end.duration.hours = parseFloat(value)
      }
    }
  }
}
</script>

<style>
.flex-calendar {
  flex-wrap: wrap;
}
.flex-day {
  border: 1px solid darkgray;
  flex: 0 1 calc(98vw / 7);
}
</style>
