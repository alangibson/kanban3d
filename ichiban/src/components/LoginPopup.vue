<template>
  <v-dialog
      persistent
      max-width="50ch"
      style="align: center"
      v-model="showLogInOverlay">

      <v-card class="pa-5">

        <v-card-title>
          <span class="headline">Welcome To Ichiban</span>
        </v-card-title>

        <v-card-text>
          <p>
            Ichiban is radically simple. Ichiban is kanban for one.
          </p>
          <v-btn @click="$store.dispatch('auth/logIn')">
            <i class="fa fa-google"></i>&nbsp; Log In with Google Account
          </v-btn>
        </v-card-text>

      </v-card>

  </v-dialog>

</template>

<script>
import firebase from '@firebase/app';
import '@firebase/auth';

export default {
  computed: {
    showLogInOverlay() {
      return !this.$store.state.auth.isLoggedIn;
    }
  }
}
</script>