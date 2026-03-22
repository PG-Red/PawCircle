<template>
  <el-container class="layout-container">
    <el-header class="header" v-if="$route.name !== 'auth'">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">🐾</div>
          <span class="title">PawCircle</span>
        </div>
        <nav class="nav-menu desktop-nav">
          <router-link to="/" class="nav-item" active-class="active">PawTrace</router-link>
          <router-link to="/profiles" class="nav-item" active-class="active">宠物档案</router-link>
          <router-link to="/feeding" class="nav-item" active-class="active">喂养记录</router-link>
          <router-link to="/trading" class="nav-item" active-class="active">宠物交易</router-link>
          <router-link to="/ai-assistant" class="nav-item" active-class="active">AI助手</router-link>
        </nav>
        <div class="user-info">
          <el-dropdown trigger="click" @command="handleCommand">
            <el-avatar :size="40" src="https://picsum.photos/seed/user/100/100" class="user-avatar" style="cursor: pointer;" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <el-main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <!-- Mobile Bottom Tab Bar -->
    <nav class="mobile-tab-bar" v-if="$route.name !== 'auth'">
      <router-link to="/" class="tab-item" active-class="active">
        <el-icon><House /></el-icon>
        <span>PawTrace</span>
      </router-link>
      <router-link to="/profiles" class="tab-item" active-class="active">
        <el-icon><Postcard /></el-icon>
        <span>档案</span>
      </router-link>
      <router-link to="/feeding" class="tab-item" active-class="active">
        <el-icon><Calendar /></el-icon>
        <span>喂养</span>
      </router-link>
      <router-link to="/trading" class="tab-item" active-class="active">
        <el-icon><ShoppingCart /></el-icon>
        <span>交易</span>
      </router-link>
      <router-link to="/ai-assistant" class="tab-item" active-class="active">
        <el-icon><ChatDotRound /></el-icon>
        <span>AI</span>
      </router-link>
    </nav>
  </el-container>
</template>

<script setup lang="ts">
import { House, Postcard, Calendar, ShoppingCart, ChatDotRound } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleCommand = (command: string) => {
  if (command === 'logout') {
    localStorage.removeItem('isAuthenticated');
    router.push('/auth');
  }
};
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background-color: var(--bg-color);
}

.header {
  background-color: var(--bg-color);
  padding: 20px 40px;
  height: auto;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--card-bg);
  padding: 12px 24px;
  border-radius: var(--border-radius-pill);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 24px;
  background-color: var(--primary-yellow);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.logo .title {
  font-size: 22px;
  font-weight: 800;
  color: var(--dark-charcoal);
  letter-spacing: -0.5px;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 700;
  padding: 10px 20px;
  border-radius: var(--border-radius-pill);
  transition: all 0.3s ease;
}

.nav-item:hover {
  color: var(--dark-charcoal);
  background-color: rgba(0,0,0,0.02);
}

.nav-item.active {
  color: var(--dark-charcoal);
  background-color: var(--primary-yellow);
}

.user-avatar {
  border: 2px solid var(--primary-yellow);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 40px;
  width: 100%;
}

.mobile-tab-bar {
  display: none;
}

@media (max-width: 768px) {
  .header {
    padding: 10px 16px;
  }
  .header-content {
    flex-wrap: nowrap;
    gap: 12px;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: var(--border-radius-lg);
  }
  .desktop-nav {
    display: none;
  }
  .main-content {
    padding: 16px;
    padding-bottom: 80px; /* Space for bottom tab bar */
  }
  
  .mobile-tab-bar {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--card-bg);
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
    padding: 8px 16px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
    justify-content: space-around;
    align-items: center;
    z-index: 1000;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
  }
  
  .tab-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    color: var(--text-secondary);
    font-size: 10px;
    font-weight: 700;
    padding: 8px;
    border-radius: var(--border-radius-sm);
    transition: all 0.2s ease;
  }
  
  .tab-item .el-icon {
    font-size: 20px;
    margin-bottom: 2px;
  }
  
  .tab-item.active {
    color: var(--dark-charcoal);
  }
  
  .tab-item.active .el-icon {
    color: var(--dark-charcoal);
    transform: scale(1.1);
  }
}

/* 路由切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
