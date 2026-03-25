<script setup lang="ts">
import type { Pet } from '../../services/api';

const props = defineProps<{ pet: Pet }>();
const emit = defineEmits<{
  (e: 'edit', pet: Pet): void;
  (e: 'detail', pet: Pet): void;
  (e: 'delete', pet: Pet): void;
}>();

// 根据生日计算年龄
const calcAge = (birthday: string) => {
  if (!birthday) return '未知';
  const years = new Date().getFullYear() - new Date(birthday).getFullYear();
  return years > 0 ? `${years}岁` : '不足1岁';
};
</script>

<template>
  <div class="pet-card">
    <div class="image-wrapper">
      <el-image :src="pet.image" class="pet-image" fit="cover" referrerPolicy="no-referrer" />
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
          <span class="value">{{ pet.birthday }}</span>
        </div>
      </div>
      <div class="pet-actions">
        <button class="action-btn delete-btn" @click="emit('delete', pet)">删除</button>
        <button class="action-btn edit-btn" @click="emit('edit', pet)">编辑</button>
        <button class="action-btn detail-btn" @click="emit('detail', pet)">详情</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pet-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease;
}

.pet-card:hover {
  transform: translateY(-5px);
}

.image-wrapper {
  position: relative;
  padding: 16px 16px 0;
}

.pet-image {
  width: 100%;
  height: 220px;
  border-radius: var(--border-radius-md);
}

.gender-badge {
  position: absolute;
  top: 24px;
  right: 24px;
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

.delete-btn {
  background-color: #fee2e2;
  color: #ef4444;
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
