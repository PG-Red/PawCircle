import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/auth/index.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/home/index.vue'),
    },
    {
      path: '/profiles',
      name: 'profiles',
      component: () => import('../views/profiles/index.vue'),
    },
    {
      path: '/feeding',
      name: 'feeding',
      component: () => import('../views/feeding/index.vue'),
    },
    {
      path: '/trading',
      name: 'trading',
      component: () => import('../views/trading/index.vue'),
    },
    {
      path: '/ai-assistant',
      name: 'ai-assistant',
      component: () => import('../views/ai/index.vue'),
    },
  ],
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.name !== 'auth' && !token) {
    next({ name: 'auth' });
  } else if (to.name === 'auth' && token) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
