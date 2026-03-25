<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { VideoPlay } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import MomentCard from './MomentCard.vue';
import CommentDrawer from './CommentDrawer.vue';
import CreateMoment from './CreateMoment.vue';
import { momentApi, likeApi, type Moment } from '../../services/api';

const moments = ref<Moment[]>([]);
const loading = ref(false);
const page = ref(1);
const hasMore = ref(true);

const commentDrawerVisible = ref(false);
const activeMomentId = ref<number | null>(null);

const loadMoments = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await momentApi.getMoments(page.value);
    const items = res.data.items.map(m => ({
      ...m,
      nickname: m.user.username,
      avatar: m.user.avatar,
      time: new Date(m.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      likes: m.likes_count,
      isLiked: m.is_liked,
    }));
    if (reset) {
      moments.value = items;
    } else {
      moments.value.push(...items);
    }
    hasMore.value = moments.value.length < res.data.total;
  } catch {
    ElMessage.error('加载动态失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => loadMoments(true));

const onComment = (id: number) => { activeMomentId.value = id; commentDrawerVisible.value = true; };

const onDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除这条动态？', '提示', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' });
    await momentApi.deleteMoment(id);
    moments.value = moments.value.filter(m => m.id !== id);
    ElMessage.success('已删除');
  } catch {}
};

const onReport = () => { ElMessage.success('举报已提交，我们会尽快处理'); };

const onLike = async (id: number) => {
  const m = moments.value.find(m => m.id === id);
  if (!m) return;
  try {
    if (m.is_liked) {
      const res = await likeApi.unlikeMoment(id);
      m.likes_count = res.data.likes_count;
      m.is_liked = false;
    } else {
      const res = await likeApi.likeMoment(id);
      m.likes_count = res.data.likes_count;
      m.is_liked = true;
    }
  } catch {
    ElMessage.error('操作失败，请重试');
  }
};

const onCreated = () => {
  page.value = 1;
  loadMoments(true);
};
</script>

<template>
  <div class="home-container">
    <el-row :gutter="30">
      <el-col :xs="24" :sm="24" :md="16">
        <CreateMoment @created="onCreated" />
        <div v-if="loading && moments.length === 0" class="loading-placeholder">
          <el-skeleton :rows="4" animated />
        </div>
        <MomentCard
          v-for="m in moments"
          :key="m.id"
          :moment="m"
          @delete="onDelete"
          @report="onReport"
          @comment="onComment"
          @like="onLike"
        />
        <div v-if="hasMore && !loading" class="load-more" @click="page++; loadMoments()">加载更多</div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8">
        <div class="featured-card dark">
          <h3>每日宠物语录</h3>
          <p>"狗是地球上唯一爱你胜过爱自己的生物。"</p>
          <div class="quote-author">- Josh Billings</div>
        </div>
        <div class="sidebar-section">
          <div class="section-header">
            <h3>为你推荐</h3>
            <span class="see-all">查看全部</span>
          </div>
          <div class="feature-item yellow-bg">
            <div class="feature-info">
              <h4>探索新活动</h4>
              <div class="tags">
                <span class="tag">10分钟</span>
                <span class="tag">傍晚</span>
              </div>
            </div>
            <div class="play-btn"><el-icon><VideoPlay /></el-icon></div>
          </div>
          <div class="feature-item white-bg">
            <div class="feature-info">
              <h4>深度睡眠冥想</h4>
              <div class="tags">
                <span class="tag">12分钟</span>
                <span class="tag">睡眠</span>
              </div>
            </div>
            <div class="play-btn yellow-text"><el-icon><VideoPlay /></el-icon></div>
          </div>
        </div>
      </el-col>
    </el-row>
    <CommentDrawer v-model="commentDrawerVisible" :moment-id="activeMomentId" />
  </div>
</template>

<style scoped>
.home-container {
  padding-bottom: 40px;
}

.loading-placeholder {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  margin-bottom: 24px;
}

.load-more {
  text-align: center;
  padding: 16px;
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
  border-radius: var(--border-radius-lg);
  background: var(--card-bg);
  margin-bottom: 24px;
  transition: background 0.2s;
}

.load-more:hover {
  background: var(--primary-yellow);
  color: var(--dark-charcoal);
}

.featured-card {
  border-radius: var(--border-radius-lg);
  padding: 30px;
  margin-bottom: 30px;
}

.featured-card.dark {
  background-color: var(--dark-charcoal);
  color: #fff;
}

.featured-card h3 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 800;
}

.featured-card p {
  font-size: 18px;
  line-height: 1.5;
  margin: 0 0 16px;
  font-weight: 600;
  color: var(--primary-yellow);
}

.quote-author {
  font-size: 14px;
  opacity: 0.7;
  font-weight: 700;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.see-all {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
}

.feature-item.yellow-bg {
  background-color: var(--primary-yellow);
}

.feature-item.white-bg {
  background-color: var(--card-bg);
}

.feature-info h4 {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--border-radius-pill);
  background-color: rgba(255, 255, 255, 0.5);
  color: var(--dark-charcoal);
}

.white-bg .tag {
  background-color: #f5f5f5;
}

.play-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--dark-charcoal);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
}

.play-btn.yellow-text {
  background-color: var(--primary-yellow);
  color: var(--dark-charcoal);
}
</style>
