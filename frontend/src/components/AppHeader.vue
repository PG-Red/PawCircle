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
        <div class="avatar-btn" @click="showProfile = true">
          <el-avatar :size="40" :src="avatarUrl" />
        </div>
        <el-tooltip content="退出登录" placement="bottom">
          <el-button class="logout-btn" circle @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </header>

  <ProfileDrawer v-model="showProfile" @avatar-change="onAvatarChange" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { House, Postcard, Calendar, ShoppingCart, ChatDotRound, SwitchButton } from '@element-plus/icons-vue';
import ProfileDrawer from './ProfileDrawer.vue';

const router = useRouter();
const showProfile = ref(false);
const avatarUrl = ref(localStorage.getItem('avatar') || 'https://picsum.photos/seed/user/100/100');

const onAvatarChange = (url: string) => {
  avatarUrl.value = url;
  if (url) localStorage.setItem('avatar', url);
};

const handleLogout = () => {
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

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.logo-icon { font-size: 28px; }

.logo-text {
  font-size: 22px;
  font-weight: 900;
  color: var(--dark-charcoal);
  letter-spacing: -0.5px;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: var(--border-radius-pill);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: var(--bg-color);
  color: var(--dark-charcoal);
}

.nav-item.active {
  background-color: var(--primary-yellow);
  color: var(--dark-charcoal);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.avatar-btn {
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid transparent;
  transition: border-color 0.2s;
}

.avatar-btn:hover {
  border-color: var(--primary-yellow);
}

.logout-btn {
  border: none;
  background-color: var(--bg-color);
  color: var(--text-secondary);
}

.logout-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

@media (max-width: 768px) {
  .desktop-nav { display: none; }
  .header-inner { padding: 0 16px; height: 60px; }
  .logo-text { font-size: 18px; }
}
</style>

