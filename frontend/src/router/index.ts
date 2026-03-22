import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/Auth.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/profiles',
      name: 'profiles',
      component: () => import('../views/Profiles.vue'),
    },
    {
      path: '/feeding',
      name: 'feeding',
      component: () => import('../views/Feeding.vue'),
    },
    {
      path: '/trading',
      name: 'trading',
      component: () => import('../views/Trading.vue'),
    },
    {
      path: '/ai-assistant',
      name: 'ai-assistant',
      component: () => import('../views/AIAssistant.vue'),
    },
  ],
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  if (to.name !== 'auth' && !isAuthenticated) {
    next({ name: 'auth' });
  } else if (to.name === 'auth' && isAuthenticated) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
