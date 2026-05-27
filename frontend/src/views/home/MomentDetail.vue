<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ChatRound, Star, ArrowLeft } from '@element-plus/icons-vue';
import { momentApi } from '@/api/index';
import type { Moment } from '@/api/moment';
import { defaultAvatar } from '@/utils/constants';

const route = useRoute();
const router = useRouter();
const moment = ref<Moment | null>(null);
const loading = ref(true);
const notFound = ref(false);

onMounted(async () => {
  const id = Number(route.params.id);
  try {
    const res = await momentApi.getMomentById(id);
    moment.value = res.data;
  } catch {
    notFound.value = true;
    ElMessage.error('动态不存在或已被删除');
  } finally {
    loading.value = false;
  }
});

const formatTime = (t: string) =>
  new Date(t).toLocaleString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

const goHome = () => router.push('/');
</script>

<template>
  <div class="detail-page">
    <!-- 顶栏 -->
    <div class="detail-topbar">
      <button class="back-btn" @click="goHome">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回主页</span>
      </button>
      <div class="brand">
        <span class="brand-paw">🐾</span>
        <span class="brand-name">PawCircle</span>
      </div>
    </div>

    <div class="detail-body">
      <!-- 加载中 -->
      <div v-if="loading" class="state-box">
        <el-icon class="spin-icon"><Star /></el-icon>
        <span>加载中...</span>
      </div>

      <!-- 404 -->
      <div v-else-if="notFound" class="state-box">
        <span class="empty-emoji">🐾</span>
        <span class="state-title">找不到这条动态</span>
        <span class="state-desc">它可能已被删除，或链接有误</span>
        <button class="primary-btn" @click="goHome">回到主页</button>
      </div>

      <!-- 动态详情 -->
      <div v-else-if="moment" class="moment-detail">
        <div class="moment-card">
          <!-- 头部 -->
          <div class="card-header">
            <el-avatar :size="52" :src="moment.user.avatar || defaultAvatar" class="user-avatar" />
            <div class="user-meta">
              <span class="username">{{ moment.user.username }}</span>
              <span class="time">{{ formatTime(moment.created_at) }}</span>
            </div>
          </div>

          <!-- 内容 -->
          <div class="card-content">
            <p class="content-text">{{ moment.content }}</p>
            <div v-if="moment.image" class="image-wrap">
              <el-image :src="moment.image" fit="cover" class="moment-img" referrerPolicy="no-referrer" lazy />
            </div>
          </div>

          <!-- 统计 -->
          <div class="card-stats">
            <div class="stat-item">
              <div class="stat-icon yellow"><el-icon><Star /></el-icon></div>
              <span>{{ moment.likes_count }} 赞</span>
            </div>
            <div class="stat-item">
              <div class="stat-icon green"><el-icon><ChatRound /></el-icon></div>
              <span>{{ moment.comments_count }} 评论</span>
            </div>
          </div>

          <!-- 引导登录 -->
          <div class="card-cta">
            <p class="cta-hint">想参与互动？加入 PawCircle 宠物社区吧！</p>
            <button class="primary-btn" @click="goHome">登录 / 注册查看完整动态</button>
          </div>
        </div>

        <!-- 底部品牌 -->
        <div class="footer-brand">
          <span>🐾</span>
          <span>PawCircle · 宠物社区</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: 'Nunito', sans-serif;
}

/* 顶栏 */
.detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: var(--card-bg);
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-color);
  border: none;
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-weight: 800;
  color: var(--dark-charcoal);
  cursor: pointer;
  padding: 8px 16px;
  border-radius: var(--border-radius-pill);
  transition: background 0.2s;
}
.back-btn:hover { background: #f0ece4; }

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
}
.brand-paw { font-size: 20px; }
.brand-name {
  font-size: 18px;
  font-weight: 900;
  color: var(--dark-charcoal);
  letter-spacing: -0.3px;
}

/* 主体 */
.detail-body {
  max-width: 620px;
  margin: 0 auto;
  padding: 36px 16px 80px;
}

/* 状态盒 */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
}
.empty-emoji { font-size: 52px; }
.state-title {
  font-size: 20px;
  font-weight: 900;
  color: var(--dark-charcoal);
}
.state-desc { font-size: 14px; color: var(--text-secondary); }
.spin-icon {
  font-size: 32px;
  color: var(--primary-yellow);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 主按钮 */
.primary-btn {
  margin-top: 4px;
  padding: 12px 28px;
  background: var(--primary-yellow);
  border: none;
  border-radius: var(--border-radius-pill);
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: var(--dark-charcoal);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(252, 211, 113, 0.5);
}

/* 动态卡片 */
.moment-card {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 28px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.user-avatar {
  border: 2px solid var(--primary-yellow);
  flex-shrink: 0;
}
.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.username {
  font-size: 18px;
  font-weight: 800;
  color: var(--dark-charcoal);
}
.time {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}

.content-text {
  font-size: 16px;
  line-height: 1.65;
  color: var(--dark-charcoal);
  font-weight: 600;
  margin: 0 0 18px;
}

.image-wrap {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: 4px;
}
.moment-img {
  width: 100%;
  display: block;
}

/* 统计 */
.card-stats {
  display: flex;
  gap: 20px;
  padding: 16px 0;
  border-top: 2px dashed #f0f0f0;
  border-bottom: 2px dashed #f0f0f0;
  margin: 20px 0;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--dark-charcoal);
}
.stat-icon {
  width: 34px; height: 34px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
}
.stat-icon.yellow { background: var(--primary-yellow); }
.stat-icon.green  { background: var(--pastel-green); }

/* CTA */
.card-cta {
  text-align: center;
  padding-top: 8px;
}
.cta-hint {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  margin: 0 0 14px;
}

/* 底部品牌 */
.footer-brand {
  text-align: center;
  margin-top: 28px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

@media (max-width: 768px) {
  .detail-topbar { padding: 12px 16px; }
  .moment-card { padding: 20px 16px; }
  .detail-body { padding: 24px 12px 60px; }
}
</style>
