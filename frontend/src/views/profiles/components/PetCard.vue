<script setup lang="ts">
import type { Pet } from '@/api/index';
import { Close } from '@element-plus/icons-vue';

const props = defineProps<{ pet: Pet }>();
const emit = defineEmits<{
  (e: 'edit', pet: Pet): void;
  (e: 'detail', pet: Pet): void;
  (e: 'delete', pet: Pet): void;
}>();

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
</script>

<template>
  <div class="pet-card">
    <button class="delete-corner-btn" @click.stop="emit('delete', pet)">
      <el-icon><Close /></el-icon>
    </button>
    <div class="image-wrapper">
      <el-image :src="pet.image" class="pet-image" fit="cover" referrerPolicy="no-referrer" lazy />
      <div class="gender-badge" :class="pet.gender === '弟弟' ? 'blue' : 'orange'">{{ pet.gender }}</div>
    </div>
    <div class="pet-info">
      <h3 class="name">{{ pet.name }}</h3>
      <div class="pet-details">
        <div class="detail-item">
          <span class="label">品种</span>
          <span class="value">{{ pet.breed }}</span>
        </div>
        <div class="detail-item">
          <span class="label">年龄</span>
          <span class="value">{{ calcAge(pet.birthday) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">生日</span>
          <span class="value">{{ formatBirthday(pet.birthday) }}</span>
        </div>
      </div>
      <div class="pet-actions">
        <button class="action-btn edit-btn" @click="emit('edit', pet)">编辑</button>
        <button class="action-btn detail-btn" @click="emit('detail', pet)">详情</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pet-card {
  position: relative;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: visible;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease;
}

.pet-card:hover {
  transform: translateY(-5px);
}

.delete-corner-btn {
  position: absolute;
  top: -14px;
  right: -14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: #ef4444;
  font-size: 14px;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  transition: all 0.2s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.pet-card:hover .delete-corner-btn {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
}

.delete-corner-btn:hover {
  background-color: #fee2e2;
  transform: scale(1.1) !important;
}

.image-wrapper {
  position: relative;
  padding: 16px 16px 0;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
}

.pet-image {
  width: 100%;
  height: 220px;
  border-radius: var(--border-radius-md);
}

.gender-badge {
  position: absolute;
  top: 24px;
  left: 24px;
  padding: 6px 16px;
  border-radius: var(--border-radius-pill);
  font-weight: 800;
  font-size: 14px;
  color: var(--dark-charcoal);
}

.gender-badge.blue {
  background-color: var(--pastel-blue);
}

.gender-badge.orange {
  background-color: var(--pastel-orange);
}

.pet-info {
  padding: 20px 24px 24px;
  background-color: var(--card-bg);
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
}

.name {
  font-size: 24px;
  font-weight: 800;
  color: var(--dark-charcoal);
  margin: 0 0 16px;
}

.pet-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 2px dashed #f0f0f0;
}

.label {
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 15px;
}

.value {
  color: var(--dark-charcoal);
  font-weight: 800;
  font-size: 15px;
}

.pet-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  height: 44px;
  font-size: 15px;
  border-radius: var(--border-radius-pill);
  font-weight: 700;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.85;
}

.edit-btn {
  background-color: #f5f5f5;
  color: var(--dark-charcoal);
}

.detail-btn {
  background-color: var(--dark-charcoal);
  color: #fff;
}
</style>

