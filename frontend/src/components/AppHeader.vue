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
          <el-badge :value="unreadTotal" :hidden="unreadTotal === 0" :max="99" class="nav-badge">
            <el-icon><Message /></el-icon>
          </el-badge>
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

        <router-link to="/ai-assistant" class="nav-item" active-class="active">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 助手</span>
        </router-link>
      </nav>

      <div class="header-actions">
        <!-- 首页动态范围切换开关 -->
        <el-radio-group 
          v-if="route.path === '/'" 
          v-model="momentFilter" 
          size="small" 
          class="moment-filter-group"
          @change="handleFilterChange"
        >
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="friends">好友</el-radio-button>
        </el-radio-group>

        <!-- 添加好友按钮，仅在私聊页面显示 -->
        <el-tooltip v-if="route.path === '/chat'" content="添加好友" placement="bottom">
          <el-button 
            circle 
            class="global-add-friend-btn" 
            @click="handleAddFriend"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </el-tooltip>

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
              <button class="dropdown-item" @click="goTo('settings')">
                <el-icon><Setting /></el-icon>
                <span>设置</span>
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

    <!-- 退出登录自定义弹窗 -->
    <el-dialog
      v-model="logoutDialogVisible"
      width="320px"
      :show-close="false"
      class="custom-logout-dialog"
      align-center
    >
      <div class="logout-dialog-content">
        <div class="logout-icon-wrapper">
          <el-icon><SwitchButton /></el-icon>
        </div>
        <h3 class="logout-title">退出登录</h3>
        <p class="logout-desc">确定要退出当前账号吗？</p>
      </div>
      <template #footer>
        <div class="logout-actions">
          <el-button class="cancel-btn" @click="logoutDialogVisible = false">再想想</el-button>
          <el-button class="confirm-btn" @click="confirmLogout">退出登录</el-button>
        </div>
      </template>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
defineOptions({ name: 'AppHeader' });

import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  House, Postcard, Calendar, ChatDotRound, Message,
  SwitchButton, User, Lock, ArrowDown, ArrowRight, Setting, Plus
} from '@element-plus/icons-vue';
import { userApi } from '@/api/index';
import { eventBus } from '@/utils/eventBus';
import { defaultAvatar } from '@/utils/constants';
import { unreadTotal } from '@/utils/unreadState';

const router  = useRouter();
const route   = useRoute();
const menuOpen = ref(false);
const menuWrapperRef = ref<HTMLElement | null>(null);

const handleAddFriend = () => {
  eventBus.emit('open-add-friend', undefined);
};

const avatarUrl = ref(localStorage.getItem('avatar') || defaultAvatar);
const username  = ref(localStorage.getItem('username') || '用户');
const momentFilter = ref<'all' | 'friends'>(localStorage.getItem('momentFilter') as 'all' | 'friends' || 'all');

const handleFilterChange = (val: string | number | boolean) => {
  localStorage.setItem('momentFilter', val as string);
  eventBus.emit('moment-filter-changed', val);
};

const fetchProfile = async () => {
  if (!localStorage.getItem('token')) return;
  try {
    const res = await userApi.getProfile();
    if (res.data?.avatar) {
      avatarUrl.value = res.data.avatar;
      localStorage.setItem('avatar', res.data.avatar);
    } else {
      avatarUrl.value = defaultAvatar;
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

const goTo = (section: 'info' | 'comments' | 'password' | 'settings') => {
  menuOpen.value = false;
  router.push(`/user/${section}`);
};

const logoutDialogVisible = ref(false);

const handleLogout = () => {
  menuOpen.value = false;
  logoutDialogVisible.value = true;
};

const confirmLogout = () => {
  logoutDialogVisible.value = false;
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('avatar');
  ElMessage.success('已退出登录');
  router.push('/auth');
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

.nav-badge :deep(.el-badge__content) {
  top: 0px;
  right: 0px;
  transform: scale(0.85) translate(50%, -50%);
  border: none;
}

.header-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

.global-add-friend-btn {
  border-color: #f0f0f0;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.global-add-friend-btn:hover {
  background: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  transform: rotate(90deg);
}

.moment-filter-group {
  margin-right: 8px;
}
.moment-filter-group :deep(.el-radio-button__inner) {
  border-radius: var(--border-radius-pill) !important;
  border: 1px solid rgba(0,0,0,0.06) !important;
  padding: 6px 12px;
  font-weight: 700;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-color);
  box-shadow: none !important;
}
.moment-filter-group :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-right: none !important;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
.moment-filter-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-left: none !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}
.moment-filter-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  border-color: var(--primary-yellow) !important;
}

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

/* 退出登录弹窗 */
:global(.custom-logout-dialog) {
  border-radius: 24px !important;
  padding: 10px !important;
}
:global(.custom-logout-dialog .el-dialog__header) {
  display: none;
}
:global(.custom-logout-dialog .el-dialog__body) {
  padding: 24px 20px 10px !important;
}
:global(.custom-logout-dialog .el-dialog__footer) {
  padding: 10px 20px 24px !important;
}
.logout-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.logout-icon-wrapper {
  width: 56px;
  height: 56px;
  background: #fee2e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.logout-icon-wrapper .el-icon {
  font-size: 26px;
  color: #ef4444;
}
.logout-title {
  font-size: 19px;
  font-weight: 900;
  color: var(--dark-charcoal);
  margin: 0 0 8px 0;
}
.logout-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}
.logout-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}
.cancel-btn {
  border-radius: 12px;
  font-weight: 800;
  height: 44px;
  border: 1px solid rgba(0,0,0,0.08);
  color: var(--dark-charcoal);
  background: #f4f4f5;
  margin: 0 !important;
}
.cancel-btn:hover {
  background: #e4e4e7;
  color: var(--dark-charcoal);
  border-color: rgba(0,0,0,0.08);
}
.confirm-btn {
  border-radius: 12px;
  font-weight: 800;
  height: 44px;
  background: #ef4444;
  border: none;
  color: #fff;
  margin: 0 !important;
}
.confirm-btn:hover {
  background: #dc2626;
  color: #fff;
}

@media (max-width: 960px) {
  .desktop-nav { display: none; }
  .header-inner { padding: 0 16px; height: 60px; }
  .logo-text { font-size: 18px; }
  .section-nav { top: 60px; }
}
</style>
