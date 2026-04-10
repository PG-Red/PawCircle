<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { Camera } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { petApi, type Pet } from '@/api/index';

const props = defineProps<{ modelValue: boolean; pet?: Pet | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { visible.value = v; });
watch(visible, v => emit('update:modelValue', v));

interface PetForm {
  name: string;
  breed: string;
  gender: '弟弟' | '妹妹';
  birthday: string;
  image: string;
  description: string;
}

const form = reactive<PetForm>({ name: '', breed: '', gender: '弟弟', birthday: '', image: '', description: '' });
const avatarInputRef = ref<HTMLInputElement | null>(null);
const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%23FBBF24'/><text font-size='56' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='central'>🐾</text></svg>`;

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
      const MAX = 260;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      form.image = canvas.toDataURL('image/jpeg', 0.78);
    };
    img.src = ev.target?.result as string;
  };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = '';
};
watch(() => props.pet, p => {
  Object.assign(form, p ?? { name: '', breed: '', gender: '弟弟', birthday: '', image: '', description: '' });
}, { immediate: true });

const isEdit = ref(false);
watch(() => props.pet, p => { isEdit.value = !!p?.id; }, { immediate: true });

const saving = ref(false);
const handleSave = async () => {
  if (!form.name || !form.breed || !form.birthday) { ElMessage.warning('请填写必填信息'); return; }

  const payload = {
    name: form.name.trim(),
    breed: form.breed.trim(),
    gender: form.gender,
    birthday: form.birthday,
    image: form.image,
    description: form.description.trim(),
  };

  saving.value = true;
  try {
    if (isEdit.value && props.pet?.id) {
      await petApi.updatePet(props.pet.id, payload);
      ElMessage.success('修改成功');
    } else {
      await petApi.addPet(payload);
      ElMessage.success('添加成功');
    }
    emit('saved');
    visible.value = false;
  } catch {
    ElMessage.error('操作失败，请重试');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <el-dialog v-model="visible" :title="isEdit ? '编辑宠物' : '添加宠物'" width="480px" align-center>
    <el-form :model="form" label-position="top" class="pet-form">
      <div class="avatar-section">
        <div class="avatar-upload-wrapper" @click="triggerAvatarUpload">
          <el-avatar :size="100" :src="form.image || defaultAvatar" class="pet-avatar" />
          <div class="avatar-overlay">
            <el-icon class="camera-icon"><Camera /></el-icon>
          </div>
        </div>
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleAvatarUpload"
        />
      </div>
      <el-form-item label="名字 *"><el-input v-model="form.name" placeholder="宠物名字" /></el-form-item>
      <el-form-item label="品种 *"><el-input v-model="form.breed" placeholder="品种" /></el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio value="弟弟">弟弟</el-radio>
          <el-radio value="妹妹">妹妹</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="生日 *">
        <el-date-picker v-model="form.birthday" type="date" placeholder="选择生日" value-format="YYYY-MM-DD" style="width:100%" />
      </el-form-item>
      <el-form-item label="描述">
        <div class="bio-wrapper">
          <textarea
            v-model="form.description"
            class="bio-textarea"
            placeholder="介绍一下你的宠物..."
            :maxlength="200"
          ></textarea>
          <span class="bio-count" :class="{ 'near-limit': form.description.length >= 180 }">
            {{ form.description.length }}/200
          </span>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="visible = false">取消</el-button>
        <el-button type="primary" class="save-btn" :loading="saving" @click="handleSave">
          {{ isEdit ? '保存修改' : '添加宠物' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.pet-form {
  padding: 8px 0;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 0 4px;
}

.avatar-upload-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  overflow: hidden;
  outline: 3px solid var(--primary-yellow);
  outline-offset: 0;
  box-sizing: border-box;
}

.avatar-upload-wrapper:hover .avatar-overlay { opacity: 1; }

.pet-avatar {
  width: 100px !important;
  height: 100px !important;
  display: block;
  border: none;
}

:deep(.pet-avatar img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.camera-icon {
  font-size: 24px;
  color: #fff;
}

.bio-wrapper {
  position: relative;
  width: 100%;
}

.bio-textarea {
  width: 100%;
  height: 90px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--dark-charcoal);
  background-color: transparent;
  resize: none;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s, background-color 0.2s;
  line-height: 1.6;
}

.bio-textarea::placeholder {
  color: var(--text-secondary);
  font-weight: 500;
}

.bio-textarea:focus {
  border-color: var(--primary-yellow);
  background-color: #fdfbf7;
}

.bio-count {
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  pointer-events: none;
}

.bio-count.near-limit {
  color: #FA8C16;
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

.save-btn {
  min-width: 112px;
  height: 40px;
  border-radius: var(--border-radius-pill);
  background-color: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
}

.save-btn:hover {
  background-color: #e5b800;
  border-color: #e5b800;
  color: var(--dark-charcoal);
}

:deep(.el-input__wrapper) {
  transition: background-color 0.2s, box-shadow 0.2s;
}

:deep(.el-input__wrapper.is-focus) {
  background-color: #fdfbf7 !important;
  box-shadow: 0 0 0 1px var(--primary-yellow) inset !important;
}

:deep(.el-radio-button__inner) {
  font-weight: 700;
}

:deep(.el-dialog) {
  border-radius: var(--border-radius-lg);
}

:deep(.el-dialog__header) {
  margin-right: 0;
  padding: 18px 24px 8px;
}

:deep(.el-dialog__title) {
  font-weight: 900;
  color: var(--dark-charcoal);
  letter-spacing: -0.2px;
}

:deep(.el-dialog__body) {
  padding: 10px 24px;
}

:deep(.el-dialog__footer) {
  padding: 12px 24px 20px;
}
</style>
