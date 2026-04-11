<template>
  <div class="user-page">
    <!-- 顶部英雄区 -->
    <div class="hero-banner">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="avatar-upload-wrapper" @click="triggerAvatarUpload">
          <div class="hero-avatar-img" :style="form.avatar ? { backgroundImage: `url('${form.avatar}')` } : {}">
            <span v-if="!form.avatar" class="avatar-default-icon">🐾</span>
          </div>
          <div class="avatar-overlay"><el-icon><Camera /></el-icon></div>
        </div>
        <input ref="avatarInputRef" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
        <div class="hero-info">
          <h1 class="hero-name">{{ form.username || '...' }}</h1>
          <p class="hero-bio">{{ form.bio || '这个人很懒，还没有填写简介' }}</p>
        </div>
      </div>
    </div>

    <!-- 标签导航 -->
    <div class="section-nav">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="section-nav-btn"
        active-class="active"
      >
        <el-icon><component :is="tab.icon" /></el-icon>
        {{ tab.label }}
      </RouterLink>
    </div>

    <!-- 子路由内容 -->
    <div class="page-body">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { Camera, User, Lock, ChatDotRound } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/api/index';
import { eventBus } from '@/utils/eventBus';

const form = reactive({ username: '', avatar: '', bio: '' });
const avatarInputRef = ref<HTMLInputElement | null>(null);

const tabs = [
  { to: '/user/info',     label: '基本信息', icon: User },
  { to: '/user/comments', label: '评论管理', icon: ChatDotRound },
  { to: '/user/password', label: '修改密码', icon: Lock },
];

onMounted(async () => {
  try {
    const res = await userApi.getProfile();
    form.username = res.data.username || '';
    form.avatar   = res.data.avatar   || '';
    form.bio      = res.data.bio      || '';
  } catch {
    form.username = localStorage.getItem('username') || '';
    form.avatar   = localStorage.getItem('avatar')   || '';
  }
});

const triggerAvatarUpload = () => avatarInputRef.value?.click();

const handleAvatarUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { ElMessage.warning('请选择图片文件'); return; }
  if (file.size > 2 * 1024 * 1024) { ElMessage.warning('图片大小不能超过 2MB'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 200;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      form.avatar = canvas.toDataURL('image/jpeg', 0.7);
      userApi.updateProfile({ username: form.username, avatar: form.avatar, bio: form.bio })
        .then((res) => {
          form.username = res.data.username || form.username;
          form.avatar = res.data.avatar || '';
          form.bio = res.data.bio || form.bio;
          localStorage.setItem('username', form.username);
          if (form.avatar) {
          localStorage.setItem('avatar', form.avatar);
          eventBus.emit('avatar-changed', form.avatar);
          } else {
            localStorage.removeItem('avatar');
            eventBus.emit('avatar-changed', '');
          }
          ElMessage.success('头像更新成功');
        })
        .catch(() => ElMessage.error('头像保存失败'));
    };
    img.src = ev.target?.result as string;
  };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = '';
};
</script>

<style scoped>
.user-page { min-height: 80vh; }

/* 英雄横幅 */
.hero-banner { position: relative; border-radius: var(--border-radius-lg); overflow: hidden; }
.hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%);
  z-index: 0;
}
.hero-bg::after {
  content: '';
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 15% 85%, rgba(255,255,255,0.18) 0%, transparent 45%),
    radial-gradient(circle at 85% 15%, rgba(255,255,255,0.12) 0%, transparent 40%);
}
.hero-content {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 28px;
  padding: 40px 44px;
}
.avatar-upload-wrapper {
  position: relative; width: 96px; height: 96px;
  border-radius: 50%; cursor: pointer; flex-shrink: 0; overflow: hidden;
  border: 4px solid rgba(255,255,255,0.65);
  box-shadow: 0 6px 24px rgba(0,0,0,0.18);
  transition: transform 0.2s;
}
.avatar-upload-wrapper:hover { transform: scale(1.05); }
.avatar-upload-wrapper:hover .avatar-overlay { opacity: 1; }
.hero-avatar-img {
  width: 100%; height: 100%;
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: #FBBF24;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-default-icon {
  font-size: 44px;
  line-height: 1;
  user-select: none;
  display: block;
}
.avatar-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
  font-size: 24px; color: #fff;
}
.hero-info { flex: 1; min-width: 0; }
.hero-name {
  font-size: 28px; font-weight: 900;
  color: var(--dark-charcoal);
  margin: 0 0 8px; letter-spacing: -0.5px;
}
.hero-bio {
  font-size: 14px; font-weight: 600;
  color: rgba(30,30,30,0.65);
  margin: 0; line-height: 1.55;
}

/* 标签导航 */
.section-nav {
  display: flex; gap: 4px;
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 8px;
  margin: 16px 0;
  position: sticky; top: 72px; z-index: 100;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
.section-nav-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 16px; border-radius: 10px;
  background: transparent; color: var(--text-secondary);
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}
.section-nav-btn:hover { background: var(--bg-color); color: var(--dark-charcoal); }
.section-nav-btn.active { background: var(--primary-yellow); color: var(--dark-charcoal); }

/* 主体 */
.page-body { display: flex; flex-direction: column; gap: 24px; }

/* 响应式 */
@media (max-width: 768px) {
  .hero-content { padding: 28px 20px; gap: 16px; }
  .hero-name { font-size: 22px; }
  .section-nav { top: 60px; }
  .section-nav-btn { font-size: 12px; padding: 8px 10px; }
}
</style> 
