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
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/chat/index.vue'),
    },
    {
      path: '/moment/:id',
      name: 'moment-detail',
      component: () => import('../views/home/MomentDetail.vue'),
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('../views/user/index.vue'),
      redirect: '/user/info',
      children: [
        {
          path: 'info',
          name: 'user-info',
          component: () => import('../views/user/components/UserInfo.vue'),
        },
        {
          path: 'comments',
          name: 'user-comments',
          component: () => import('../views/user/components/UserComments.vue'),
        },
        {
          path: 'password',
          name: 'user-password',
          component: () => import('../views/user/components/UserPassword.vue'),
        },
      ],
    },
  ],
});

router.beforeEach((to, from) => {
  const token = localStorage.getItem('token');
  // 分享动态页面允许未登录访问
  if (to.name === 'moment-detail') return;
  if (to.name !== 'auth' && !token) {
    return { name: 'auth' };
  } else if (to.name === 'auth' && token) {
    return { name: 'home' };
  }
});

export default router;
