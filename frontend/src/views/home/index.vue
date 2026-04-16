<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { VideoPlay } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import MomentCard from './components/MomentCard.vue';
import CommentDrawer from './components/CommentDrawer.vue';
import CreateMoment from './components/CreateMoment.vue';
import PublicProfileDrawer from '@/components/PublicProfileDrawer.vue';
import { momentApi, likeApi, type Moment as ApiMoment } from '@/api/index';
import { eventBus } from '@/utils/eventBus';

const route = useRoute();
const highlightedMomentId = ref<number | null>(null);
const highlightCommentId = ref<number | null>(null);

type MomentView = ApiMoment & {
  nickname: string;
  avatar: string;
  time: string;
  likes?: number;
  isLiked?: boolean;
  hasCommented?: boolean;
  is_commented?: boolean;
};

const moments = ref<MomentView[]>([]);
const loading = ref(false);
const page = ref(1);
const hasMore = ref(true);

const commentDrawerVisible = ref(false);
const activeMomentId = ref<number | null>(null);
const publicProfileVisible = ref(false);
const selectedUserId = ref<number | null>(null);

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
      hasCommented: m.is_commented,
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

onMounted(() => {
  loadMoments(true).then(async () => {
    const momentIdParam = route.query.highlightMoment;
    const commentIdParam = route.query.highlightComment;
    if (momentIdParam) {
      await nextTick();
      const momentId = Number(momentIdParam);
      // 将目标动态置顶
      const idx = moments.value.findIndex(m => m.id === momentId);
      if (idx > 0) {
        const [target] = moments.value.splice(idx, 1);
        moments.value.unshift(target);
      }
      highlightedMomentId.value = momentId;
      await nextTick();
      // 滚动到置顶的动态
      setTimeout(async () => {
        const el = document.getElementById(`moment-${momentId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 打开评论抽屉并高亮指定评论
        if (commentIdParam) {
          highlightCommentId.value = Number(commentIdParam);
        }
        activeMomentId.value = momentId;
        commentDrawerVisible.value = true;
        setTimeout(() => {
          highlightedMomentId.value = null;
          highlightCommentId.value = null;
        }, 3000);
      }, 400);
    }
  });
  eventBus.on('comment-deleted', handleCommentDeleted);
});

const onComment = (id: number) => { activeMomentId.value = id; commentDrawerVisible.value = true; };

const onUserClick = (userId: number) => {
  selectedUserId.value = userId;
  publicProfileVisible.value = true;
};

const onDelete = async (id: number) => {
  try {
    await momentApi.deleteMoment(id);
    // 软删除：从当前用户的列表中移除，其他用户仍可见
    moments.value = moments.value.filter(m => m.id !== id);
    ElMessage.success('动态已删除');
  } catch {
    ElMessage.error('操作失败，请重试');
  }
};

const onReport = () => { ElMessage.success('举报已提交，我们会尽快处理'); };

const onLike = async (id: number) => {
  const idx = moments.value.findIndex(m => m.id === id);
  if (idx === -1) return;
  const m = moments.value[idx];
  try {
    if (m.is_liked) {
      const res = await likeApi.unlikeMoment(id);
      moments.value.splice(idx, 1, { ...m, likes_count: res.data.likes_count, is_liked: false, isLiked: false, likes: res.data.likes_count });
    } else {
      const res = await likeApi.likeMoment(id);
      moments.value.splice(idx, 1, { ...m, likes_count: res.data.likes_count, is_liked: true, isLiked: true, likes: res.data.likes_count });
    }
  } catch {
    ElMessage.error('操作失败，请重试');
  }
};

const onCreated = () => {
  page.value = 1;
  loadMoments(true);
};

const onCommentChange = (momentId: number, delta: number, hasCommented: boolean) => {
  const idx = moments.value.findIndex(m => m.id === momentId);
  if (idx === -1) return;
  const m = moments.value[idx];
  moments.value.splice(idx, 1, { ...m, comments_count: Math.max(0, (m.comments_count ?? 0) + delta), hasCommented });
};

// 监听从个人资料抽屉删除评论的事件
const handleCommentDeleted = ({ momentId, commentId, hasUserCommented }: { momentId: number; commentId: number; hasUserCommented: boolean }) => {
  const idx = moments.value.findIndex(m => m.id === momentId);
  if (idx === -1) return;
  const m = moments.value[idx];
  moments.value.splice(idx, 1, {
    ...m,
    comments_count: Math.max(0, (m.comments_count ?? 0) - 1),
    hasCommented: hasUserCommented,
  });
};

onUnmounted(() => {
  eventBus.off('comment-deleted', handleCommentDeleted);
});
</script>

<template>
  <div class="home-container">
    <el-row :gutter="30">
      <el-col :xs="24" :sm="24" :md="16">
        <CreateMoment @created="onCreated" />
        <MomentCard
          v-for="m in moments"
          :key="m.id"
          :id="`moment-${m.id}`"
          :moment="m"
          :class="{ 'moment-highlight': highlightedMomentId === m.id }"
          @delete="onDelete"
          @report="onReport"
          @comment="onComment"
          @like="onLike"
          @user-click="onUserClick"
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
    <CommentDrawer v-model="commentDrawerVisible" :moment-id="activeMomentId" :highlight-comment-id="highlightCommentId" @comment-change="onCommentChange" />
    <PublicProfileDrawer v-model="publicProfileVisible" :user-id="selectedUserId" />
  </div>
</template>

<style scoped>
.home-container {
  padding-bottom: 40px;
}

.moment-highlight {
  animation: highlightPulse 2.5s ease-out forwards;
}

@keyframes highlightPulse {
  0%   { box-shadow: 0 0 0 0 rgba(252, 211, 113, 0.9); outline: 3px solid var(--primary-yellow); }
  50%  { box-shadow: 0 0 0 10px rgba(252, 211, 113, 0.2); }
  100% { box-shadow: none; outline: 3px solid transparent; }
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
