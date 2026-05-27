<template>
  <div class="layout-container">
    <AppHeader v-if="$route.name !== 'auth' && $route.name !== 'moment-detail'" />

    <main class="main-content" :class="{ 'no-header': $route.name === 'moment-detail' }">
      <router-view v-slot="{ Component, route }">
        <keep-alive>
          <component :is="Component" v-if="route.meta.keepAlive" :key="route.fullPath" />
        </keep-alive>
        <component :is="Component" v-if="!route.meta.keepAlive" :key="route.fullPath" />
      </router-view>
    </main>

    <!-- Mobile Bottom Tab Bar -->
    <nav class="mobile-tab-bar" v-if="$route.name !== 'auth' && $route.name !== 'moment-detail'">
      <router-link to="/" class="tab-item" active-class="active">
        <el-icon><House /></el-icon>
        <span>PawTrace</span>
      </router-link>
      <router-link to="/chat" class="tab-item" active-class="active">
        <el-badge :value="unreadTotal" :hidden="unreadTotal === 0" :max="99" class="tab-badge">
          <el-icon><Message /></el-icon>
        </el-badge>
        <span>私聊</span>
      </router-link>
      <router-link to="/profiles" class="tab-item" active-class="active">
        <el-icon><Postcard /></el-icon>
        <span>档案</span>
      </router-link>
      <router-link to="/feeding" class="tab-item" active-class="active">
        <el-icon><Calendar /></el-icon>
        <span>喂养</span>
      </router-link>

      <router-link to="/ai-assistant" class="tab-item" active-class="active">
        <el-icon><ChatDotRound /></el-icon>
        <span>AI</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { House, Postcard, Calendar, ChatDotRound, Message } from '@element-plus/icons-vue';
import AppHeader from './components/AppHeader.vue';
import { unreadTotal, startUnreadPolling, stopUnreadPolling } from '@/utils/unreadState';

const route = useRoute();

onMounted(() => {
  if (route.name !== 'auth') {
    startUnreadPolling();
  }
});

onUnmounted(() => {
  stopUnreadPolling();
});

watch(() => route.name, (newName) => {
  if (newName === 'auth') {
    stopUnreadPolling();
  } else {
    startUnreadPolling();
  }
});
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  background-color: var(--bg-color);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 40px;
  width: 100%;
}

.main-content.no-header {
  max-width: 100%;
  padding: 0;
}

.mobile-tab-bar {
  display: none;
}

@media (max-width: 960px) {
  .main-content {
    padding: 16px;
    padding-bottom: 80px;
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
  
  .tab-badge :deep(.el-badge__content) {
    top: 0px;
    right: 0px;
    transform: scale(0.8) translate(50%, -50%);
    border: none;
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
