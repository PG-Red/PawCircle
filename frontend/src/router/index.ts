import { createRouter, createWebHistory } from 'vue-router';

// 用于全局缓存每个 keepAlive 页面的滚动位置
const scrollPositions = new Map<string, number>();

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
      meta: { keepAlive: true },
    },
    {
      path: '/profiles',
      name: 'profiles',
      component: () => import('../views/profiles/index.vue'),
      meta: { keepAlive: true },
    },
    {
      path: '/feeding',
      name: 'feeding',
      component: () => import('../views/feeding/index.vue'),
      meta: { keepAlive: true },
    },
    {
      path: '/ai-assistant',
      name: 'ai-assistant',
      component: () => import('../views/ai/index.vue'),
      meta: { keepAlive: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/chat/index.vue'),
      meta: { keepAlive: true },
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
      meta: { keepAlive: true },
      children: [
        {
          path: 'info',
          name: 'user-info',
          component: () => import('../views/user/UserInfo.vue'),
        },
        {
          path: 'comments',
          name: 'user-comments',
          component: () => import('../views/user/UserComments.vue'),
        },
        {
          path: 'password',
          name: 'user-password',
          component: () => import('../views/user/UserPassword.vue'),
        },
        {
          path: 'settings',
          name: 'user-settings',
          component: () => import('../views/user/UserSettings.vue'),
        },
      ],
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    // 同步返回缓存的位置，避免 { top: 0 } 引起的闪烁
    if (to.meta.keepAlive && to.name && scrollPositions.has(to.name as string)) {
      return { top: scrollPositions.get(to.name as string) };
    }
    return { top: 0 };
  }
});

router.beforeEach((to, from) => {
  // 在真正离开前记录当前页面的滚动高度
  if (from.meta.keepAlive && from.name) {
    scrollPositions.set(from.name as string, window.scrollY || document.documentElement.scrollTop);
  }

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
