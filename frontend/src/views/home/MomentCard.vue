<script setup lang="ts">
import { ref } from 'vue';
import { ChatRound, Star, Share, MoreFilled, Delete, Warning } from '@element-plus/icons-vue';

interface Moment {
  id: number;
  nickname: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes?: number;
  isLiked?: boolean;
}

const props = defineProps<{ moment: Moment }>();
const emit = defineEmits<{
  (e: 'delete', id: number): void;
  (e: 'report', id: number): void;
  (e: 'comment', id: number): void;
  (e: 'like', id: number): void;
}>();

const menuOpen = ref(false);
const liked = ref(props.moment.isLiked ?? false);
const likesCount = ref(props.moment.likes ?? 0);

const toggleMenu = (e: Event) => { e.stopPropagation(); menuOpen.value = !menuOpen.value; };
const closeMenu = () => { menuOpen.value = false; };
const onDelete = () => { menuOpen.value = false; emit('delete', props.moment.id); };
const onReport = () => { menuOpen.value = false; emit('report', props.moment.id); };
const onComment = () => { emit('comment', props.moment.id); };
const onLike = () => {
  liked.value = !liked.value;
  likesCount.value += liked.value ? 1 : -1;
  emit('like', props.moment.id);
};
</script>

<template>
  <div class="moment-card" @click="closeMenu">
    <div class="moment-header">
      <el-avatar :size="48" :src="moment.avatar" class="moment-avatar" />
      <div class="user-meta">
        <span class="nickname">{{ moment.nickname }}</span>
        <span class="time">{{ moment.time }}</span>
      </div>
      <div class="more-menu-wrapper">
        <el-button circle class="more-btn" @click.stop="toggleMenu"><el-icon><MoreFilled /></el-icon></el-button>
        <transition name="menu-fade">
          <div v-if="menuOpen" class="dropdown-menu" @click.stop>
            <div class="dropdown-item delete" @click="onDelete"><el-icon><Delete /></el-icon><span>删除</span></div>
            <div class="dropdown-item report" @click="onReport"><el-icon><Warning /></el-icon><span>举报</span></div>
          </div>
        </transition>
      </div>
    </div>
    <div class="moment-content">
      <p>{{ moment.content }}</p>
      <div v-if="moment.image" class="image-wrapper">
        <el-image :src="moment.image" class="moment-image" fit="cover" referrerPolicy="no-referrer" />
      </div>
    </div>
    <div class="moment-footer">
      <div class="action-btn" :class="{ liked }" @click="onLike">
        <div class="icon-wrapper yellow"><el-icon><Star /></el-icon></div>
        <span>{{ likesCount > 0 ? likesCount : '点赞' }}</span>
      </div>
      <div class="action-btn" @click="onComment">
        <div class="icon-wrapper green"><el-icon><ChatRound /></el-icon></div>
        <span>评论</span>
      </div>
      <div class="action-btn">
        <div class="icon-wrapper purple"><el-icon><Share /></el-icon></div>
        <span>分享</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.moment-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.moment-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.moment-avatar {
  border: 2px solid var(--primary-yellow);
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
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
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

.dropdown-item.report {
  color: #fa8c16;
}

.dropdown-item.report:hover {
  background: #fff7e6;
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

@media (max-width: 768px) {
  .moment-card {
    padding: 16px;
  }

  .moment-footer {
    flex-wrap: wrap;
    gap: 16px;
  }

  .icon-wrapper {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
}
</style>
