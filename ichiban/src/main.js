import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import Vuetify from 'vuetify'
import '../node_modules/vuetify/dist/vuetify.min.css'
import VueShortkey from 'vue-shortkey';

Vue.config.productionTip = false;
Vue.config.devtools = true;

Vue.use(Vuetify);
Vue.use(VueShortkey);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
