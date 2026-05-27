<script setup lang="ts">
import { ref, computed, useAttrs } from 'vue';
import { ChatRound, Star, Share, MoreFilled, Delete, Warning } from '@element-plus/icons-vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { defaultAvatar } from '@/utils/constants';

interface Moment {
  id: number;
  nickname: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes?: number;
  isLiked?: boolean;
  comments_count?: number;
  hasCommented?: boolean;
  user?: { id: number };
}

const props = defineProps<{ moment: Moment; canDelete?: boolean }>();
const attrs = useAttrs();
const emit = defineEmits<{
  (e: 'delete', id: number): void;
  (e: 'comment', id: number): void;
  (e: 'like', id: number): void;
  (e: 'user-click', userId: number): void;
}>();

const menuOpen = ref(false);
const deleteDialogVisible = ref(false);
const liked = computed(() => props.moment.isLiked ?? false);
const likesCount = computed(() => props.moment.likes ?? 0);

const toggleMenu = (e: Event) => { e.stopPropagation(); menuOpen.value = !menuOpen.value; };
const closeMenu = () => { menuOpen.value = false; };
const onDelete = () => { menuOpen.value = false; deleteDialogVisible.value = true; };
const onComment = () => { emit('comment', props.moment.id); };
const onLike = () => { emit('like', props.moment.id); };
const onUserClick = () => {
  if (props.moment.user?.id) emit('user-click', props.moment.user.id);
};

const onShare = async () => {
  const url = `${window.location.origin}/moment/${props.moment.id}`;
  try {
    await navigator.clipboard.writeText(url);
    shareToast.value = true;
    setTimeout(() => { shareToast.value = false; }, 2200);
  } catch {
    // 降级：创建临时 input 复制
    const inp = document.createElement('input');
    inp.value = url;
    document.body.appendChild(inp);
    inp.select();
    document.execCommand('copy');
    document.body.removeChild(inp);
    shareToast.value = true;
    setTimeout(() => { shareToast.value = false; }, 2200);
  }
};

const shareToast = ref(false);
</script>

<script lang="ts">
export default { name: 'MomentCard' };
</script>

<template>
  <ConfirmDialog
    v-model="deleteDialogVisible"
    title="确认删除动态？"
    description="删除后将无法恢复，确定要删除这条动态吗？"
    ok-text="删除"
    @confirm="emit('delete', moment.id)"
  />

  <div class="moment-card" v-bind="attrs" @click="closeMenu">
    <div class="moment-header">
      <el-avatar :size="48" :src="moment.avatar || defaultAvatar" class="moment-avatar clickable-avatar" @click.stop="onUserClick" />
      <div class="user-meta">
        <span class="nickname">{{ moment.nickname }}</span>
        <span class="time">{{ moment.time }}</span>
      </div>
      <div v-if="canDelete" class="more-menu-wrapper">
        <el-button circle class="more-btn" @click.stop="toggleMenu"><el-icon><MoreFilled /></el-icon></el-button>
        <transition name="menu-fade">
          <div v-if="menuOpen" class="dropdown-menu" @click.stop>
            <div class="dropdown-item delete" @click="onDelete"><el-icon><Delete /></el-icon><span>删除</span></div>
          </div>
        </transition>
      </div>
    </div>
    <div class="moment-content">
      <p>{{ moment.content }}</p>
      <div v-if="moment.image" class="image-wrapper">
        <el-image :src="moment.image" class="moment-image" fit="cover" referrerPolicy="no-referrer" lazy />
      </div>
    </div>
    <div class="moment-footer">
      <div class="action-btn" :class="{ liked }" @click="onLike">
        <div class="icon-wrapper yellow"><el-icon><Star /></el-icon></div>
        <span>{{ likesCount > 0 ? likesCount : '赞' }}</span>
      </div>
      <div class="action-btn" :class="{ commented: moment.hasCommented }" @click="onComment">
        <div class="icon-wrapper green"><el-icon><ChatRound /></el-icon></div>
        <span>{{ moment.comments_count && moment.comments_count > 0 ? moment.comments_count : '评论' }}</span>
      </div>
      <div class="action-btn share-btn" @click.stop="onShare">
        <div class="icon-wrapper purple"><el-icon><Share /></el-icon></div>
        <span>分享</span>
      </div>
    </div>
    <transition name="toast-fade">
      <div v-if="shareToast" class="share-toast">
        🔗 链接已复制，发给好友吧！
      </div>
    </transition>
  </div>
</template>

<style scoped>
.moment-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  position: relative;
  transition: transform 0.3s ease;
  cursor: pointer;
}

.moment-card:hover {
  transform: scale(1.02);
}

.moment-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.moment-avatar {
  border: 2px solid var(--primary-yellow);
  flex-shrink: 0;
  width: 48px !important;
  height: 48px !important;
}

.clickable-avatar {
  cursor: pointer;
  transition: transform 0.16s ease;
}

.clickable-avatar:hover {
  transform: scale(1.06);
}

.user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 18px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.time {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 600;
}

.more-btn {
  border: none;
  background: #f5f5f5;
  color: var(--dark-charcoal);
}

.more-menu-wrapper {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ebebeb;
  padding: 6px;
  min-width: 120px;
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.dropdown-item.delete {
  color: #ff4d4f;
}

.dropdown-item.delete:hover {
  background: #fff1f0;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.moment-content p {
  font-size: 16px;
  line-height: 1.6;
  color: var(--dark-charcoal);
  margin: 0 0 16px;
  font-weight: 600;
}

.image-wrapper {
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.moment-image {
  width: 100%;
  display: block;
}

.moment-footer {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px dashed #f0f0f0;
  min-height: 56px;
}

.action-btn span {
  min-width: 24px;
  display: inline-block;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 700;
  color: var(--dark-charcoal);
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.8;
}

.action-btn.liked span {
  color: var(--primary-yellow);
}

.action-btn.commented span {
  color: var(--primary-yellow);
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.icon-wrapper.yellow {
  background-color: var(--primary-yellow);
}

.icon-wrapper.green {
  background-color: var(--pastel-green);
}

.icon-wrapper.purple {
  background-color: var(--pastel-purple);
}

.share-toast {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>

