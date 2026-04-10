<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Promotion, Delete } from '@element-plus/icons-vue';
import { commentApi, type Comment } from '../../api/index';

const props = defineProps<{ modelValue: boolean; momentId: number | null; highlightCommentId?: number | null }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'comment-change', momentId: number, delta: number, hasCommented: boolean): void;
}>();

const currentUserId = Number(localStorage.getItem('userId'));

const hasCurrentUserCommented = () => comments.value.some(c => c.user.id === currentUserId);

const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { visible.value = v; });
watch(visible, v => { emit('update:modelValue', v); });

const commentInput = ref('');
const submitting = ref(false);
const loading = ref(false);
const comments = ref<Comment[]>([]);

// 打开时加载评论
watch(() => props.momentId, async (id) => {
  if (!id) return;
  comments.value = [];
  loading.value = true;
  try {
    const res = await commentApi.getComments(id);
    let items: Comment[] = res.data.items;
    // 若有高亮评论，将其置顶
    if (props.highlightCommentId) {
      const idx = items.findIndex(c => c.id === props.highlightCommentId);
      if (idx > 0) {
        const [target] = items.splice(idx, 1);
        items = [target, ...items];
      }
    }
    comments.value = items;
    // 滚动到高亮评论
    if (props.highlightCommentId) {
      await nextTick();
      setTimeout(() => {
        const el = document.getElementById(`comment-${props.highlightCommentId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  } catch {
    ElMessage.error('加载评论失败');
  } finally {
    loading.value = false;
  }
});

const formatTime = (t: string) => {
  const diff = Date.now() - new Date(t).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
};

const submitComment = async () => {
  if (!commentInput.value.trim() || !props.momentId) return;
  submitting.value = true;
  try {
    const res = await commentApi.createComment(props.momentId, commentInput.value.trim());
    comments.value.push(res.data);
    commentInput.value = '';
    emit('comment-change', props.momentId, 1, hasCurrentUserCommented());
  } catch {
    ElMessage.error('评论失败，请重试');
  } finally {
    submitting.value = false;
  }
};

const deleteComment = async (commentId: number) => {
  if (!props.momentId) return;
  try {
    await commentApi.deleteComment(props.momentId, commentId);
    comments.value = comments.value.filter(c => c.id !== commentId);
    emit('comment-change', props.momentId, -1, hasCurrentUserCommented());
  } catch {
    ElMessage.error('删除失败，请重试');
  }
};
</script>

<script lang="ts">
export default { name: 'CommentDrawer' };
</script>

<template>
  <el-drawer v-model="visible" title="评论" direction="btt" size="70%">
    <div class="comment-drawer">
      <div class="comment-list">
        <div v-if="loading" class="loading-tip"><el-skeleton :rows="3" animated /></div>
        <div v-else-if="comments.length === 0" class="empty-tip">暂无评论，来抢沙发吧！</div>
        <div v-for="c in comments" :key="c.id" :id="`comment-${c.id}`" :class="['comment-item', { 'comment-item--highlight': c.id === highlightCommentId }]">
          <el-avatar :size="36" :src="c.user.avatar" class="c-avatar" />
          <div class="c-body">
            <div class="c-header">
              <span class="c-name">{{ c.user.username }}</span>
              <div class="c-header-right">
                <span class="c-time">{{ formatTime(c.created_at) }}</span>
                <button v-if="c.user.id === currentUserId" class="c-delete" @click="deleteComment(c.id)"><el-icon><Delete /></el-icon></button>
              </div>
            </div>
            <p class="c-content">{{ c.content }}</p>
          </div>
        </div>
      </div>
      <div class="comment-input-bar">
        <input v-model="commentInput" class="c-input" placeholder="写下你的评论..." @keyup.enter="submitComment" />
        <button class="c-send" :disabled="submitting || !commentInput.trim()" @click="submitComment">
          <el-icon><Promotion /></el-icon>
        </button>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.comment-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-tip,
.empty-tip {
  padding: 24px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.comment-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.c-avatar {
  flex-shrink: 0;
  border: 2px solid var(--primary-yellow);
}

.c-body {
  flex: 1;
}

.c-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  align-items: center;
}

.c-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.c-delete {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  font-size: 14px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.c-delete:hover {
  color: #ff4d4f;
}

.c-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.c-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.c-content {
  margin: 0;
  font-size: 15px;
  color: var(--dark-charcoal);
  line-height: 1.5;
}

.comment-input-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0 0;
  border-top: 2px dashed #f0f0f0;
  margin-top: 12px;
}

.c-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius-pill);
  font-family: inherit;
  font-size: 14px;
  color: var(--dark-charcoal);
  background: var(--bg-color);
  outline: none;
  transition: border-color 0.2s;
}

.c-input:focus {
  border-color: var(--primary-yellow);
}

.c-send {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-yellow);
  border: none;
  color: var(--dark-charcoal);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.comment-item--highlight {
  background: rgba(252, 211, 113, 0.18);
  border-radius: 10px;
  padding: 8px;
  margin: -8px;
  animation: commentPulse 2.5s ease-out forwards;
}

@keyframes commentPulse {
  0%   { background: rgba(252, 211, 113, 0.35); box-shadow: 0 0 0 3px rgba(252,211,113,0.5); }
  60%  { background: rgba(252, 211, 113, 0.18); box-shadow: 0 0 0 6px rgba(252,211,113,0.1); }
  100% { background: transparent; box-shadow: none; }
}

.c-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
