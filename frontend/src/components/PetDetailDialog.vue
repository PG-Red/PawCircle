<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { petApi } from '@/api';
import type { Pet } from '@/api/pet';

const props = defineProps<{
  modelValue: boolean;
  petId: number | null;
  initialData?: any;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const detailLoading = ref(false);
const detailPet = ref<Pet | any>(null);

const calcAge = (birthday: string) => {
  if (!birthday) return '未知';
  const birthDate = new Date(birthday);
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0 && months === 0) return '不足一个月';

  let result = '';
  if (years > 0) result += `${years}年`;
  if (months > 0) result += `${months}个月`;

  return result || '不足一个月';
};

const formatBirthday = (birthday: string) => {
  if (!birthday) return '-';
  return birthday.slice(0, 10);
};

watch(() => props.modelValue, async (val) => {
  if (val && props.petId) {
    if (props.initialData) {
      detailPet.value = props.initialData;
      // 如果 initialData 已经包含了完整的宠物信息，则不再请求接口
      if (props.initialData.breed && props.initialData.birthday !== undefined) {
        return;
      }
    }
    detailLoading.value = true;
    try {
      const res = await petApi.getPet(props.petId);
      detailPet.value = res.data || res;
    } catch {
      // ignore
    } finally {
      detailLoading.value = false;
    }
  } else {
    detailPet.value = null;
  }
});

const handleClose = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <el-dialog :model-value="modelValue" @update:model-value="handleClose" title="宠物详情" width="520px" align-center>
    <div v-loading="detailLoading" class="detail-content">
      <template v-if="detailPet">
        <el-image :src="detailPet.image" class="detail-image" fit="cover" referrerPolicy="no-referrer" lazy />
        <h3 class="detail-name">{{ detailPet.name }}</h3>
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">品种</span>
            <span class="detail-value">{{ detailPet.breed }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">性别</span>
            <span class="detail-value">{{ detailPet.gender }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">年龄</span>
            <span class="detail-value">{{ calcAge(detailPet.birthday) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">生日</span>
            <span class="detail-value">{{ formatBirthday(detailPet.birthday) }}</span>
          </div>
        </div>
        <div class="detail-desc">
          <div class="detail-desc-title">宠物描述</div>
          <p>{{ detailPet.description || '这个小家伙还没有留下介绍～' }}</p>
        </div>
      </template>
    </div>
  </el-dialog>
</template>

<style scoped>
.detail-content { min-height: 240px; }
.detail-image { width: 100%; height: 220px; border-radius: 8px; margin-bottom: 16px; }
.detail-name { margin: 0 0 14px; font-size: 24px; font-weight: 900; color: #333; }
.detail-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
.detail-row { display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 2px dashed #f0f0f0; }
.detail-label { color: #888; font-size: 14px; font-weight: 700; }
.detail-value { color: #333; font-size: 14px; font-weight: 800; }
.detail-desc { background: #f9f9f9; border-radius: 8px; padding: 14px; }
.detail-desc-title { font-weight: 800; color: #333; margin-bottom: 8px; }
.detail-desc p { margin: 0; color: #666; line-height: 1.7; font-size: 14px; }
</style>
