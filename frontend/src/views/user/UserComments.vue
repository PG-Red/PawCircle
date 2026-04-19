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
    <div class="section-header">
      <el-icon class="section-icon"><ChatDotRound /></el-icon>
      <h2>评论管理</h2>
      <span class="section-badge">{{ myComments.length }}</span>
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
      <div v-else class="comment-list">
        <div v-for="c in myComments" :key="c.id" class="comment-item" @click="goToMoment(c)">
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
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChatDotRound, Loading, Document, ArrowRight } from '@element-plus/icons-vue';
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
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px;
}
.section-header h2 {
  font-size: 18px; font-weight: 900;
  color: var(--dark-charcoal); margin: 0; letter-spacing: -0.3px;
}
.section-icon {
  font-size: 18px; padding: 7px;
  border-radius: 8px;
  background: var(--primary-yellow);
  color: var(--dark-charcoal);
}
.section-badge {
  margin-left: 4px;
  background: var(--primary-yellow); color: var(--dark-charcoal);
  font-size: 12px; font-weight: 800;
  padding: 2px 8px; border-radius: 20px;
}
.section-card {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 28px 32px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
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

