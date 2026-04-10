<template>
  <header class="app-header">
    <div class="header-inner">
      <div class="logo">
        <span class="logo-icon">🐾</span>
        <span class="logo-text">PawCircle</span>
      </div>

      <nav class="desktop-nav">
        <router-link to="/" class="nav-item" active-class="active" exact>
          <el-icon><House /></el-icon>
          <span>PawTrace</span>
        </router-link>
        <router-link to="/chat" class="nav-item" active-class="active">
          <el-icon><Message /></el-icon>
          <span>好友私聊</span>
        </router-link>
        <router-link to="/profiles" class="nav-item" active-class="active">
          <el-icon><Postcard /></el-icon>
          <span>档案</span>
        </router-link>
        <router-link to="/feeding" class="nav-item" active-class="active">
          <el-icon><Calendar /></el-icon>
          <span>喂养</span>
        </router-link>
        <router-link to="/trading" class="nav-item" active-class="active">
          <el-icon><ShoppingCart /></el-icon>
          <span>交易</span>
        </router-link>
        <router-link to="/ai-assistant" class="nav-item" active-class="active">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 助手</span>
        </router-link>
      </nav>

      <div class="header-actions">
        <!-- 头像 + 下拉菜单 -->
        <div class="avatar-menu-wrapper" ref="menuWrapperRef">
          <div class="avatar-btn" @click="toggleMenu">
            <el-avatar :size="40" :src="avatarUrl" />
            <el-icon class="chevron" :class="{ open: menuOpen }"><ArrowDown /></el-icon>
          </div>

          <transition name="menu-fade">
            <div v-if="menuOpen" class="avatar-dropdown">
              <div class="dropdown-header">
                <el-avatar :size="44" :src="avatarUrl" />
                <div class="dropdown-user">
                  <span class="dropdown-name">{{ username }}</span>
                  <span class="dropdown-sub">个人中心</span>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" @click="goTo('info')">
                <el-icon><User /></el-icon>
                <span>基本信息</span>
                <el-icon class="item-arrow"><ArrowRight /></el-icon>
              </button>
              <button class="dropdown-item" @click="goTo('comments')">
                <el-icon><ChatDotRound /></el-icon>
                <span>评论管理</span>
                <el-icon class="item-arrow"><ArrowRight /></el-icon>
              </button>
              <button class="dropdown-item" @click="goTo('password')">
                <el-icon><Lock /></el-icon>
                <span>修改密码</span>
                <el-icon class="item-arrow"><ArrowRight /></el-icon>
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import {
  House, Postcard, Calendar, ShoppingCart, ChatDotRound, Message,
  SwitchButton, User, Lock, ArrowDown, ArrowRight
} from '@element-plus/icons-vue';
import { userApi } from '@/api/index';
import { eventBus } from '@/utils/eventBus';

const router  = useRouter();
const route   = useRoute();
const menuOpen = ref(false);
const menuWrapperRef = ref<HTMLElement | null>(null);

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%23FBBF24'/><text font-size='56' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='central'>🐾</text></svg>`;
const avatarUrl = ref(localStorage.getItem('avatar') || DEFAULT_AVATAR);
const username  = ref(localStorage.getItem('username') || '用户');

const fetchProfile = async () => {
  if (!localStorage.getItem('token')) return;
  try {
    const res = await userApi.getProfile();
    if (res.data?.avatar) {
      avatarUrl.value = res.data.avatar;
      localStorage.setItem('avatar', res.data.avatar);
    } else {
      avatarUrl.value = DEFAULT_AVATAR;
      localStorage.removeItem('avatar');
    }
    if (res.data?.username) {
      username.value = res.data.username;
      localStorage.setItem('username', res.data.username);
    }
  } catch {}
};

onMounted(() => {
  fetchProfile();
  document.addEventListener('click', onClickOutside);
  // 监听用户页面保存头像后的更新
  eventBus.on('avatar-changed', (url: unknown) => {
    avatarUrl.value = url as string;
  });
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
});

watch(() => route.path, (p) => { if (p !== '/auth') fetchProfile(); });

const toggleMenu = () => { menuOpen.value = !menuOpen.value; };

const onClickOutside = (e: MouseEvent) => {
  if (menuWrapperRef.value && !menuWrapperRef.value.contains(e.target as Node)) {
    menuOpen.value = false;
  }
};

const goTo = (section: 'info' | 'comments' | 'password') => {
  menuOpen.value = false;
  router.push(`/user/${section}`);
};

const handleLogout = () => {
  menuOpen.value = false;
  ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('avatar');
    ElMessage.success('已退出登录');
    router.push('/auth');
  }).catch(() => {});
};
</script>

<style scoped>
.app-header {
  background-color: var(--card-bg);
  border-bottom: 2px solid rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 1000;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.logo { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.logo-icon { font-size: 28px; }
.logo-text { font-size: 22px; font-weight: 900; color: var(--dark-charcoal); letter-spacing: -0.5px; }

.desktop-nav { display: flex; align-items: center; gap: 4px; }
.nav-item {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px;
  border-radius: var(--border-radius-pill);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 15px; font-weight: 700;
  transition: all 0.2s ease;
}
.nav-item:hover { background-color: var(--bg-color); color: var(--dark-charcoal); }
.nav-item.active { background-color: var(--primary-yellow); color: var(--dark-charcoal); }

.header-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

/* 头像菜单 */
.avatar-menu-wrapper { position: relative; }
.avatar-btn {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer;
  padding: 4px 10px 4px 4px;
  border-radius: 40px;
  border: 2px solid transparent;
  transition: border-color 0.2s, background 0.2s;
}
.avatar-btn:hover { border-color: var(--primary-yellow); background: var(--bg-color); }
.avatar-btn :deep(.el-avatar) { display: block; border-radius: 50%; overflow: hidden; }
.chevron {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform 0.25s;
}
.chevron.open { transform: rotate(180deg); }

/* 下拉菜单 */
.avatar-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 220px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07);
  padding: 8px;
  z-index: 2000;
  border: 1px solid rgba(0,0,0,0.06);
}
.dropdown-header {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 10px 12px;
}
.dropdown-user { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dropdown-name {
  font-size: 15px; font-weight: 800;
  color: var(--dark-charcoal);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dropdown-sub { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.dropdown-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 4px 0; }
.dropdown-item {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border: none; border-radius: 10px;
  background: transparent;
  color: var(--dark-charcoal);
  font-size: 14px; font-weight: 700;
  cursor: pointer; text-align: left;
  transition: background 0.15s;
  font-family: inherit;
}
.dropdown-item:hover { background: var(--bg-color); }
.dropdown-item.danger { color: #ef4444; }
.dropdown-item.danger:hover { background: #fee2e2; }
.item-arrow { margin-left: auto; font-size: 12px; color: var(--text-secondary); }

/* 动画 */
.menu-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.menu-fade-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.menu-fade-enter-from { opacity: 0; transform: translateY(-6px) scale(0.97); }
.menu-fade-leave-to  { opacity: 0; transform: translateY(-6px) scale(0.97); }

@media (max-width: 960px) {
  .desktop-nav { display: none; }
  .header-inner { padding: 0 16px; height: 60px; }
  .logo-text { font-size: 18px; }
  .section-nav { top: 60px; }
}
</style>
