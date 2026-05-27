<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { Camera } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { petApi, type Pet } from '@/api/index';
import { defaultAvatar } from '@/utils/constants';

const props = defineProps<{ modelValue: boolean; pet?: Pet | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { 
  visible.value = v; 
});
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

const triggerAvatarUpload = () => avatarInputRef.value?.click();

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
  const canvas = document.createElement('canvas');
  canvas.width = 260;
  canvas.height = 260;
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(
    rawImgObj.value,
    -cropX.value / cropZoom.value,
    -cropY.value / cropZoom.value,
    containerSize / cropZoom.value,
    containerSize / cropZoom.value,
    0,
    0,
    260,
    260
  );
  form.image = canvas.toDataURL('image/jpeg', 0.8);
  cropDialogVisible.value = false;
};

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
const breedOptions = ['猫', '狗', '兔子', '仓鼠', '鸟类', '乌龟', '鱼类', '爬宠', '其他'];
const breedType = ref('');
const customBreed = ref('');

watch(() => props.pet, async p => {
  Object.assign(form, p ?? { name: '', breed: '', gender: '弟弟', birthday: '', image: '', description: '' });
  if (p && p.breed) {
    if (breedOptions.includes(p.breed) && p.breed !== '其他') {
      breedType.value = p.breed;
      customBreed.value = '';
    } else {
      breedType.value = '其他';
      customBreed.value = p.breed;
    }
  } else {
    breedType.value = '';
    customBreed.value = '';
  }
}, { immediate: true });

const isEdit = ref(false);
watch(() => props.pet, p => { isEdit.value = !!p?.id; }, { immediate: true });

const saving = ref(false);
const handleSave = async () => {
  const finalBreed = breedType.value === '其他' ? customBreed.value.trim() : breedType.value;
  if (!form.name || !finalBreed || !form.birthday) { ElMessage.warning('请填写必填信息'); return; }

  const payload = {
    name: form.name.trim(),
    breed: finalBreed,
    gender: form.gender,
    birthday: form.birthday,
    image: form.image,
    description: form.description.trim(),
  };

  saving.value = true;
  try {
    let petId = props.pet?.id;
    if (isEdit.value && petId) {
      await petApi.updatePet(petId, payload);
    } else {
      const res = await petApi.addPet(payload);
      petId = res.data.id;
    }

    ElMessage.success(isEdit.value ? '修改成功' : '添加成功');
    emit('saved');
    visible.value = false;
  } catch (error) {
    console.error('Save failed:', error);
    ElMessage.error('操作失败，请重试');
  } finally {
    saving.value = false;
  }
};

const disabledDate = (time: Date) => {
  return time.getTime() > Date.now();
};
</script>

<template>
  <el-dialog v-model="visible" :title="isEdit ? '编辑宠物' : '添加宠物'" width="480px" align-center class="pet-dialog">
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
      <el-form-item label="品种 *">
        <div style="display: flex; gap: 10px; width: 100%;">
          <el-select v-model="breedType" placeholder="选择品种" :style="{ flex: breedType === '其他' ? '0 0 120px' : '1' }">
            <el-option v-for="item in breedOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-input
            v-if="breedType === '其他'"
            v-model="customBreed"
            placeholder="请输入自定义品种"
            style="flex: 1;"
          />
        </div>
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio value="弟弟">弟弟</el-radio>
          <el-radio value="妹妹">妹妹</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="生日 *">
        <el-date-picker
          v-model="form.birthday"
          type="date"
          placeholder="选择生日"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
          style="width:100%"
        />
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
        <el-button type="primary" class="save-btn" @click="handleCropConfirm">确认裁剪</el-button>
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

:deep(.pet-dialog .el-dialog__header) {
  padding-bottom: 0;
  margin-bottom: 12px;
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
</style>

