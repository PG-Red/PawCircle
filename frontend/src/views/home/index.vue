<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Promotion } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import MomentCard from './components/MomentCard.vue';
import CommentDrawer from './components/CommentDrawer.vue';
import CreateMoment from './components/CreateMoment.vue';
import PublicProfileDrawer from '@/components/PublicProfileDrawer.vue';
import { momentApi, likeApi, type Moment as ApiMoment } from '@/api/index';
import { eventBus } from '@/utils/eventBus';

const route = useRoute();
const router = useRouter();
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
const currentUserId = Number(localStorage.getItem('userId') || 0);

const commentDrawerVisible = ref(false);
const activeMomentId = ref<number | null>(null);
const publicProfileVisible = ref(false);
const selectedUserId = ref<number | null>(null);

// 每日宠物语录数据
const quotes = [
  { text: "狗是地球上唯一爱你胜过爱自己的生物。", author: "Josh Billings" },
  { text: "直到一个人爱上一只动物，他灵魂的一部分才会被唤醒。", author: "Anatole France" },
  { text: "时光飞逝，与猫相伴的日子永远不会嫌多。", author: "Sigmund Freud" },
  { text: "一只狗能教你的东西很多，最重要的是无条件去爱。", author: "Unknown" },
  { text: "如果天堂没有狗，那我死后要去它们去的地方。", author: "Will Rogers" },
  { text: "没有宠物的家，只是一栋房子。", author: "Unknown" },
  { text: "猫咪用一种神秘的咕噜声，治愈了我们一天的疲惫。", author: "Unknown" }
];

// 今日一问数据
const questionGroups = [
  [
    { question: "狗狗突然不吃东西，可能是什么原因？", isYellow: true },
    { question: "猫咪每天需要喝多少水才算健康？", isYellow: false },
    { question: "如何判断宠物是否需要立刻去看医生？", isYellow: true }
  ],
  [
    { question: "幼猫第一次打疫苗应该在几个月大？", isYellow: true },
    { question: "狗狗吃草是正常行为吗？", isYellow: false }
  ],
  [
    { question: "怎么让新来的狗狗更快适应家里的环境？", isYellow: true },
    { question: "猫咪掉毛严重是生病了吗？", isYellow: false },
    { question: "宠物可以吃哪些人类的食物，哪些绝对不能吃？", isYellow: true }
  ],
  [
    { question: "狗狗总是追着尾巴转，这是什么行为？", isYellow: true },
    { question: "猫咪为什么喜欢在深夜乱跑乱叫？", isYellow: false }
  ],
  [
    { question: "宠物体内驱虫和体外驱虫有什么区别，多久做一次？", isYellow: true },
    { question: "怎么训练狗狗定点上厕所？", isYellow: false },
    { question: "猫咪不爱喝水怎么办？", isYellow: true }
  ],
  [
    { question: "狗狗洗澡多久一次比较合适？", isYellow: true },
    { question: "宠物绝育手术有哪些好处和风险？", isYellow: false }
  ],
  [
    { question: "猫咪抓家具怎么纠正？", isYellow: true },
    { question: "狗狗分离焦虑症怎么缓解？", isYellow: false },
    { question: "如何给宠物选择合适的粮食？", isYellow: true }
  ]
];

// 获取每天唯一的索引
const dayIndex = computed(() => {
  const d = new Date();
  return d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate();
});

const dailyQuote = computed(() => quotes[dayIndex.value % quotes.length]);
const dailyQuestions = computed(() => questionGroups[dayIndex.value % questionGroups.length]);

const askAI = (question: string) => {
  router.push({ name: 'ai-assistant', query: { q: question } });
};

const currentFilter = ref<'all' | 'friends'>(localStorage.getItem('momentFilter') as 'all' | 'friends' || 'all');

const loadMoments = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await momentApi.getMoments(page.value, 10, currentFilter.value);
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
  eventBus.on('moment-filter-changed', handleFilterChanged);
});

const handleFilterChanged = (filterVal: unknown) => {
  currentFilter.value = filterVal as 'all' | 'friends';
  page.value = 1;
  loadMoments(true);
};

const onComment = (id: number) => { activeMomentId.value = id; commentDrawerVisible.value = true; };

const onUserClick = (userId: number) => {
  selectedUserId.value = userId;
  publicProfileVisible.value = true;
};

const onDelete = async (id: number) => {
  const targetMoment = moments.value.find(m => m.id === id);
  if (!targetMoment || targetMoment.user?.id !== currentUserId) {
    ElMessage.warning('只能删除自己发布的动态');
    return;
  }

  try {
    await momentApi.deleteMoment(id);
    // 软删除：从当前用户的列表中移除，其他用户仍可见
    moments.value = moments.value.filter(m => m.id !== id);
    ElMessage.success('动态已删除');
  } catch {
    ElMessage.error('操作失败，请重试');
  }
};

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
  eventBus.off('moment-filter-changed', handleFilterChanged);
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
          :can-delete="m.user?.id === currentUserId"
          :class="{ 'moment-highlight': highlightedMomentId === m.id }"
          @delete="onDelete"
          @comment="onComment"
          @like="onLike"
          @user-click="onUserClick"
        />
        <div v-if="hasMore && !loading" class="load-more" @click="page++; loadMoments()">加载更多</div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8">
        <div class="sticky-sidebar">
          <div class="featured-card dark">
            <h3>每日宠物语录</h3>
            <p>"{{ dailyQuote.text }}"</p>
            <div class="quote-author">- {{ dailyQuote.author }}</div>
          </div>
          <div class="sidebar-section">
            <div class="section-header">
              <h3>今日一问</h3>
            </div>
            <div 
              v-for="(item, index) in dailyQuestions" 
              :key="index"
              class="feature-item question-item" 
              :class="item.isYellow ? 'yellow-bg' : 'white-bg'"
            >
              <div class="feature-info">
                <p class="question-text">{{ item.question }}</p>
              </div>
              <div class="play-btn" :class="{ 'yellow-text': !item.isYellow }" @click="askAI(item.question)">
                <el-icon><Promotion /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    <CommentDrawer v-model="commentDrawerVisible" :moment-id="activeMomentId" :highlight-comment-id="highlightCommentId" @comment-change="onCommentChange" />
    <PublicProfileDrawer v-model="publicProfileVisible" :user-id="selectedUserId" />
    
    <!-- 返回顶部按钮 -->
    <el-backtop :right="40" :bottom="100" />
  </div>
</template>

<style scoped>
.home-container {
  padding-bottom: 40px;
}

.sticky-sidebar {
  position: sticky;
  top: 80px; /* 留出顶部导航栏的高度 */
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
  transition: transform 0.3s ease;
}

.featured-card:hover {
  transform: scale(1.02);
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
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: scale(1.02);
}

.feature-item.question-item {
  align-items: flex-start;
  gap: 12px;
}

.feature-item.yellow-bg {
  background-color: var(--primary-yellow);
}

.feature-item.white-bg {
  background-color: var(--card-bg);
}

.feature-info {
  flex: 1;
  min-width: 0;
}

.question-text {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--dark-charcoal);
  line-height: 1.5;
  word-break: break-all;
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
  flex-shrink: 0;
  border-radius: 50%;
  background-color: var(--dark-charcoal);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.play-btn:hover {
  transform: scale(1.1);
}

.play-btn.yellow-text {
  background-color: var(--primary-yellow);
  color: var(--dark-charcoal);
}
</style>
