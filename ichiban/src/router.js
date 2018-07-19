import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/views/Home.vue'
import Privacy from '@/views/Privacy.vue'
import Metrics from '@/views/Metrics.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: Privacy
    },
    {
      path: '/metrics',
      name: 'metrics',
      component: Metrics
    }
  ]
})
