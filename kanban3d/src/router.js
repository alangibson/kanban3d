import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Calendar from './views/Calendar.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: Calendar
    }
  ]
})
