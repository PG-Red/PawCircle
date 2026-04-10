<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
import { momentApi } from '../../api/index';
import { eventBus } from '../../utils/eventBus';

const emit = defineEmits<{ (e: 'created'): void }>();
const content = ref('');
const imageUrl = ref('');
const submitting = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%23FBBF24'/><text font-size='56' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='central'>🐾</text></svg>`;
const currentAvatar = ref(localStorage.getItem('avatar') || DEFAULT_AVATAR);
const avatarUrl = computed(() => currentAvatar.value || DEFAULT_AVATAR);

const syncAvatar = (url?: unknown) => {
  const nextAvatar = typeof url === 'string' ? url : localStorage.getItem('avatar');
  currentAvatar.value = nextAvatar || DEFAULT_AVATAR;
};

const triggerUpload = () => fileInputRef.value?.click();
const handleImageUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { ElMessage.warning('请选择图片文件'); return; }
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过 5MB'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      imageUrl.value = canvas.toDataURL('image/jpeg', 0.8);
    };
    img.src = ev.target?.result as string;
  };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = '';
};

const handleSubmit = async () => {
  if (!content.value.trim()) { ElMessage.warning('请输入内容'); return; }
  submitting.value = true;
  try {
    await momentApi.createMoment({
      content: content.value.trim(),
      image: imageUrl.value || undefined,
    });
    ElMessage.success('发布成功');
    content.value = '';
    imageUrl.value = '';
    emit('created');
  } catch {
    ElMessage.error('发布失败，请重试');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  eventBus.on('avatar-changed', syncAvatar);
});

onUnmounted(() => {
  eventBus.off('avatar-changed', syncAvatar);
});
</script>

<script lang="ts">
export default { name: 'CreateMoment' };
</script>

<template>
  <div class="create-moment-card">
    <div class="create-body">
      <el-avatar :size="44" :src="avatarUrl" class="me-avatar" />
      <div class="create-right">
        <textarea v-model="content" class="create-textarea" placeholder="分享你和毛孩子的美好瞬间..." :maxlength="500" />
        <div v-if="imageUrl" class="preview-wrapper">
          <el-image :src="imageUrl" fit="cover" class="preview-img" />
          <button class="remove-img" @click="imageUrl = ''">×</button>
        </div>
        <div class="create-actions">
          <button class="upload-img-btn" @click="triggerUpload" type="button">
            <el-icon><Picture /></el-icon>
            <span>上传图片</span>
          </button>
          <input ref="fileInputRef" type="file" accept="image/*" style="display:none" @change="handleImageUpload" />
          <button class="post-btn" :disabled="submitting || !content.trim()" @click="handleSubmit">
            {{ submitting ? '发布中...' : '发布' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-moment-card {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.create-body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.me-avatar {
  border: 2px solid var(--primary-yellow);
  flex-shrink: 0;
}

.create-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create-textarea {
  width: 100%;
  min-height: 72px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-family: inherit;
  font-size: 15px;
  color: var(--dark-charcoal);
  background: var(--bg-color);
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.create-textarea:focus {
  border-color: var(--primary-yellow);
}

.create-textarea::placeholder {
  color: var(--text-secondary);
}

.preview-wrapper {
  position: relative;
  width: 120px;
}

.preview-img {
  width: 120px;
  height: 90px;
  border-radius: 8px;
  display: block;
}

.remove-img {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #333;
  color: #fff;
  border: none;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.upload-img-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px dashed #d0d0d0;
  border-radius: var(--border-radius-pill);
  background: transparent;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.upload-img-btn:hover {
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  background: rgba(255, 200, 0, 0.06);
}

.post-btn {
  padding: 10px 24px;
  border-radius: var(--border-radius-pill);
  background: var(--dark-charcoal);
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.post-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.post-btn:not(:disabled):hover {
  opacity: 0.85;
}

@media (max-width: 480px) {
  .post-btn {
    padding: 10px 16px;
  }
}
</style>
