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
          <p class="hero-code">ID：{{ form.user_code || '生成中...' }}</p>
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

    <!-- 裁剪头像弹窗 -->
    <el-dialog v-model="cropDialogVisible" title="裁剪头像" width="380px" align-center :close-on-click-modal="false" append-to-body>
      <div class="crop-container"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <img
          v-if="rawImgObj"
          :src="rawImgObj.src"
          class="crop-image"
          :style="{
            transform: `translate(${cropX}px, ${cropY}px) scale(${cropZoom})`,
            transformOrigin: '0 0'
          }"
          draggable="false"
        />
        <div class="crop-overlay"></div>
      </div>
      <div class="crop-controls">
        <span class="zoom-icon">−</span>
        <el-slider v-model="cropZoom" :min="cropMinZoom" :max="cropMinZoom * 3" :step="0.01" :show-tooltip="false" style="flex:1;" />
        <span class="zoom-icon">+</span>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-btn" @click="cropDialogVisible = false">取消</el-button>
          <el-button type="primary" class="save-btn crop-save" :loading="isUploading" @click="handleCropConfirm">确认裁剪</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { Camera, User, Lock, ChatDotRound, Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/api/index';
import { eventBus } from '@/utils/eventBus';

const form = reactive({ user_code: '', username: '', avatar: '', bio: '' });
const avatarInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

// 裁剪相关状态
const cropDialogVisible = ref(false);
const rawImgObj = ref<HTMLImageElement | null>(null);
const cropZoom = ref(1);
const cropMinZoom = ref(1);
const cropX = ref(0);
const cropY = ref(0);
const containerSize = 300;

let isDragging = false;
let startPointerX = 0;
let startPointerY = 0;
let initialCropX = 0;
let initialCropY = 0;

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));

const updateCropConstraints = () => {
  if (!rawImgObj.value) return;
  const img = rawImgObj.value;
  const minX = containerSize - img.width * cropZoom.value;
  const minY = containerSize - img.height * cropZoom.value;
  cropX.value = clamp(cropX.value, minX, 0);
  cropY.value = clamp(cropY.value, minY, 0);
};

watch(cropZoom, updateCropConstraints);

const onPointerDown = (e: PointerEvent) => {
  isDragging = true;
  startPointerX = e.clientX;
  startPointerY = e.clientY;
  initialCropX = cropX.value;
  initialCropY = cropY.value;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
};

const onPointerMove = (e: PointerEvent) => {
  if (!isDragging) return;
  const dx = e.clientX - startPointerX;
  const dy = e.clientY - startPointerY;
  
  if (!rawImgObj.value) return;
  const img = rawImgObj.value;
  const minX = containerSize - img.width * cropZoom.value;
  const minY = containerSize - img.height * cropZoom.value;
  
  cropX.value = clamp(initialCropX + dx, minX, 0);
  cropY.value = clamp(initialCropY + dy, minY, 0);
};

const onPointerUp = (e: PointerEvent) => {
  isDragging = false;
  (e.target as HTMLElement).releasePointerCapture(e.pointerId);
};

const handleCropConfirm = () => {
  if (!rawImgObj.value) return;
  isUploading.value = true;
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(
    rawImgObj.value,
    -cropX.value / cropZoom.value,
    -cropY.value / cropZoom.value,
    containerSize / cropZoom.value,
    containerSize / cropZoom.value,
    0,
    0,
    200,
    200
  );
  const croppedAvatar = canvas.toDataURL('image/jpeg', 0.8);
  
  userApi.updateProfile({ username: form.username, avatar: croppedAvatar, bio: form.bio })
    .then((res) => {
      form.user_code = res.data.user_code || form.user_code;
      form.username = res.data.username || form.username;
      form.avatar = res.data.avatar || '';
      form.bio = res.data.bio || form.bio;

      localStorage.setItem('user_code', form.user_code);
      localStorage.setItem('username', form.username);
      if (form.avatar) {
        localStorage.setItem('avatar', form.avatar);
        eventBus.emit('avatar-changed', form.avatar);
      } else {
        localStorage.removeItem('avatar');
        eventBus.emit('avatar-changed', '');
      }

      ElMessage.success('头像更新成功');
      cropDialogVisible.value = false;
    })
    .catch(() => {
      ElMessage.error('头像保存失败');
    })
    .finally(() => {
      isUploading.value = false;
    });
};

const tabs = [
  { to: '/user/info',     label: '基本信息', icon: User },
  { to: '/user/comments', label: '评论管理', icon: ChatDotRound },
  { to: '/user/password', label: '修改密码', icon: Lock },
  { to: '/user/settings', label: '设置', icon: Setting },
];

onMounted(async () => {
  try {
    const res = await userApi.getProfile();
    form.user_code = res.data.user_code || '';
    form.username = res.data.username || '';
    form.avatar   = res.data.avatar   || '';
    form.bio      = res.data.bio      || '';

    localStorage.setItem('user_code', form.user_code);
    localStorage.setItem('username', form.username);
    if (form.avatar) localStorage.setItem('avatar', form.avatar);
    else localStorage.removeItem('avatar');
  } catch {
    form.user_code = localStorage.getItem('user_code') || '';
    form.username = localStorage.getItem('username') || '';
    form.avatar   = localStorage.getItem('avatar')   || '';
  }
});

const triggerAvatarUpload = () => avatarInputRef.value?.click();

const handleAvatarUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { ElMessage.warning('请选择图片文件'); return; }
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过 5MB'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      rawImgObj.value = img;
      const minZ = Math.max(containerSize / img.width, containerSize / img.height);
      cropMinZoom.value = minZ;
      cropZoom.value = minZ;
      cropX.value = (containerSize - img.width * minZ) / 2;
      cropY.value = (containerSize - img.height * minZ) / 2;
      cropDialogVisible.value = true;
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
.hero-code {
  display: inline-flex;
  align-items: center;
  margin: 0 0 10px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.28);
  color: #5b4309;
  font-size: 12px;
  font-weight: 800;
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

/* 裁剪弹窗相关样式 */
.crop-container {
  width: 300px;
  height: 300px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: grab;
  touch-action: none;
}
.crop-container:active {
  cursor: grabbing;
}
.crop-image {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  max-width: none !important;
  max-height: none !important;
}
.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 50%;
  box-shadow: 0 0 0 999px rgba(0,0,0,0.5);
  border: 2px solid var(--primary-yellow);
  pointer-events: none;
}
.crop-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px auto 0;
  width: 300px;
}
.zoom-icon {
  font-size: 20px;
  font-weight: bold;
  color: #666;
  user-select: none;
  cursor: default;
}
.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.cancel-btn {
  min-width: 96px;
  height: 40px;
  border-radius: var(--border-radius-pill);
  font-weight: 800;
  color: var(--text-secondary);
}
.crop-save {
  min-width: 112px;
  height: 40px;
  border-radius: var(--border-radius-pill);
  background-color: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
  box-shadow: none;
  margin: 0;
}
.crop-save:hover {
  background-color: #e5b800;
  border-color: #e5b800;
  color: var(--dark-charcoal);
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-content { padding: 28px 20px; gap: 16px; }
  .hero-name { font-size: 22px; }
  .section-nav { top: 60px; }
  .section-nav-btn { font-size: 12px; padding: 8px 10px; }
}
</style> 
