import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },

  ],
  scrollBehavior() {
    // Always scroll to the top when navigating
    return { top: 0 };
  }
})

export default router
