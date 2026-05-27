<template>
  <section class="profile-section">
    <ConfirmDialog
      v-model="deleteDialogVisible"
      title="确认删除评论？"
      description="删除后将无法恢复，确定要删除这条评论吗？"
      ok-text="删除"
      default-icon="💬"
      @confirm="confirmDeleteComment"
    />
    <div class="section-header compact-header">
      <div class="section-heading">
        <div class="section-icon-badge">
          <el-icon class="section-icon"><ChatDotRound /></el-icon>
        </div>
        <div class="section-heading-copy">
          <div class="title-with-badge">
            <h2>评论管理</h2>
            <span class="section-badge">{{ myComments.length }}</span>
          </div>
          <p>查看和管理您在社区中留下的所有评论。</p>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button v-if="selectedDates.length > 0" size="small" round @click="selectedDates = []" class="clear-btn">
          取消查询 ({{ selectedDates[0] }})
        </el-button>
        <div class="picker-container" title="按日期筛选">
          <el-date-picker
            v-model="selectedDates"
            type="dates"
            :disabled-date="disabledDate"
            :cell-class-name="getCellClass"
            value-format="YYYY-MM-DD"
            popper-class="comment-date-picker-popper"
            class="hidden-picker"
          />
          <el-button circle class="icon-btn"><el-icon><Calendar /></el-icon></el-button>
        </div>
      </div>
    </div>
    <div class="section-card">
      <div v-if="myCommentsLoading" class="state-box">
        <el-icon class="spin-icon"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="myComments.length === 0" class="state-box">
        <span class="empty-emoji">💬</span>
        <span>还没有发表过评论</span>
      </div>
      <div v-else-if="groupedComments.length === 0" class="state-box">
        <span class="empty-emoji">🔍</span>
        <span>该时间段内没有评论</span>
      </div>
      <div v-else class="comment-groups">
        <div v-for="group in groupedComments" :key="group.key" class="comment-group">
          <h3 class="group-title">{{ group.key }}</h3>
          <div class="comment-list">
            <div v-for="c in group.items" :key="c.id" class="comment-item" @click="goToMoment(c)">
              <div class="comment-moment-ref">
                <el-icon><Document /></el-icon>
                <span>{{ c.moment_content?.slice(0, 40) }}{{ (c.moment_content?.length ?? 0) > 40 ? '...' : '' }}</span>
                <el-icon class="goto-icon"><ArrowRight /></el-icon>
              </div>
              <div class="comment-body">
                <span class="comment-content">{{ c.content }}</span>
                <el-button class="del-btn" type="danger" link size="small" @click.stop="deleteMyComment(c)">删除</el-button>
              </div>
              <div class="comment-time">{{ formatTime(c.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ChatDotRound, Loading, Document, ArrowRight, Search, Calendar } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { commentApi } from '@/api/index';
import { eventBus } from '@/utils/eventBus';
import type { Comment } from '@/api/comment';

const router = useRouter();

const myComments = ref<(Comment & { moment_content?: string; moment_id?: number })[]>([]);
const myCommentsLoading = ref(false);
const deleteDialogVisible = ref(false);
const pendingDeleteComment = ref<(Comment & { moment_id?: number }) | null>(null);

const selectedDates = ref<string[]>([]);
const selectedDate = computed(() => selectedDates.value[0] || null);

watch(selectedDates, (newVal) => {
  // 当选中了多个日期时，只保留最后选中的那一个，实现“单选但不自动关闭弹窗”
  if (newVal && newVal.length > 1) {
    selectedDates.value = [newVal[newVal.length - 1]];
  }
});

onMounted(() => {
  loadMyComments();
});

const loadMyComments = async () => {
  myCommentsLoading.value = true;
  try {
    const res = await commentApi.getMyComments();
    myComments.value = res.data.items;
  } catch {
    ElMessage.error('加载评论失败');
  } finally {
    myCommentsLoading.value = false;
  }
};

const commentDates = computed(() => {
  const dates = new Set<string>();
  myComments.value.forEach(c => {
    const d = new Date(c.created_at);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.add(`${yyyy}-${mm}-${dd}`);
  });
  return dates;
});

const disabledDate = (time: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return time.getTime() > today.getTime();
};

const getCellClass = (time: Date) => {
  const yyyy = time.getFullYear();
  const mm = String(time.getMonth() + 1).padStart(2, '0');
  const dd = String(time.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  
  if (commentDates.value.has(dateStr)) {
    return 'has-comment-cell';
  }
  return '';
};

const filteredComments = computed(() => {
  if (!selectedDate.value) {
    return myComments.value;
  }
  return myComments.value.filter(c => {
    const d = new Date(c.created_at);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    return dateStr === selectedDate.value;
  });
});

const groupedComments = computed(() => {
  const groups: Record<string, typeof myComments.value> = {};
  filteredComments.value.forEach(c => {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });
  
  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a)) // 按年月倒序排列
    .map(key => ({
      key,
      items: groups[key]
    }));
});

const deleteMyComment = (c: Comment & { moment_id?: number }) => {
  pendingDeleteComment.value = c;
  deleteDialogVisible.value = true;
};

const confirmDeleteComment = async () => {
  const c = pendingDeleteComment.value;
  if (!c) return;
  try {
    const res = await commentApi.deleteComment(c.moment_id!, c.id);
    myComments.value = myComments.value.filter(item => item.id !== c.id);
    const hasUserCommented = (res.data as any)?.has_user_commented ?? false;
    eventBus.emit('comment-deleted', { momentId: c.moment_id!, commentId: c.id, hasUserCommented });
    ElMessage.success('评论已删除');
  } catch {
    ElMessage.error('删除失败，请重试');
  } finally {
    pendingDeleteComment.value = null;
  }
};

const goToMoment = (c: Comment & { moment_id?: number }) => {
  if (!c.moment_id) return;
  router.push({ path: '/', query: { highlightMoment: String(c.moment_id), highlightComment: String(c.id) } });
};

const formatTime = (t: string) =>
  new Date(t).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<style scoped>
.profile-section { }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.picker-container {
  position: relative;
  width: 40px;
  height: 40px;
}

:deep(.hidden-picker) {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 40px !important;
  height: 40px !important;
  opacity: 0 !important;
  z-index: 2 !important;
  cursor: pointer !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  overflow: hidden !important;
}

:deep(.hidden-picker .el-input__wrapper) {
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;
  cursor: pointer !important;
}

:deep(.hidden-picker input) {
  cursor: pointer !important;
}

.icon-btn {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  font-size: 18px;
  background: var(--card-bg);
  border-color: rgba(0,0,0,0.06);
  color: var(--dark-charcoal);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.clear-btn {
  font-weight: 700;
  color: var(--text-secondary);
}

.compact-header {
  background: transparent;
}

.section-heading {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.section-heading-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-with-badge h2 {
  font-size: 18px;
  font-weight: 900;
  color: var(--dark-charcoal);
  margin: 0;
  letter-spacing: -0.3px;
}

.section-heading-copy p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.section-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffe59a 0%, #ffc940 100%);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.24);
  flex-shrink: 0;
}

.section-icon {
  font-size: 15px;
  color: #3b2f17;
}

.section-badge {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #3b2f17;
  font-size: 12px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 20px;
}

.section-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,248,235,0.96) 100%);
  border-radius: 24px;
  padding: 28px 32px;
  box-shadow: 0 16px 40px rgba(34, 24, 10, 0.08);
  border: 1px solid rgba(243, 199, 95, 0.22);
}

.state-box {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px;
  padding: 40px 0;
  color: var(--text-secondary); font-size: 14px; font-weight: 600;
}
.empty-emoji { font-size: 32px; }
.spin-icon { font-size: 28px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.comment-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--dark-charcoal);
  margin: 0 0 12px 4px;
  padding-bottom: 8px;
  border-bottom: 2px dashed rgba(243, 199, 95, 0.3);
}

.comment-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item {
  background: var(--bg-color);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.comment-item:hover { border-color: var(--primary-yellow); box-shadow: 0 2px 12px rgba(252,211,113,0.2); }
.comment-moment-ref {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--text-secondary); font-weight: 600;
  border-left: 3px solid var(--primary-yellow);
  padding-left: 8px; line-height: 1.4;
}
.goto-icon { margin-left: auto; opacity: 0.4; transition: opacity 0.2s; flex-shrink: 0; }
.comment-item:hover .goto-icon { opacity: 1; color: var(--dark-charcoal); }
.comment-body {
  display: flex; align-items: center;
  justify-content: space-between; gap: 8px;
}
.comment-content {
  font-size: 14px; font-weight: 700;
  color: var(--dark-charcoal); flex: 1; line-height: 1.5;
}
.del-btn { flex-shrink: 0; font-size: 12px; font-weight: 700; padding: 0; }
.comment-time { font-size: 11px; color: var(--text-secondary); font-weight: 600; }

@media (max-width: 768px) {
  .section-card { padding: 20px 16px; }
}
</style>

<style>
.comment-date-picker-popper .el-date-table td.has-comment-cell .el-date-table-cell__text {
  color: #1a1a1a !important;
  font-weight: 900 !important;
  background-color: rgba(251, 191, 36, 0.25) !important;
  border-radius: 50% !important;
}
</style>

