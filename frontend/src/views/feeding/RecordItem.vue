<script setup lang="ts">
import { Bowl, Goblet } from '@element-plus/icons-vue';

interface Record {
  date: string;
  petName: string;
  type: 'Food' | 'Water';
  food: string;
  amount: string;
}

defineProps<{ record: Record }>();
</script>

<template>
  <div class="record-item">
    <div class="record-icon" :class="record.type === 'Food' ? 'green' : 'blue'">
      <el-icon><Bowl v-if="record.type === 'Food'" /><Goblet v-else /></el-icon>
    </div>
    <div class="record-info">
      <h4>{{ record.petName }} - {{ record.food }}</h4>
      <span class="time">{{ record.date }}</span>
    </div>
    <div class="record-amount">{{ record.amount }}</div>
  </div>
</template>

<style scoped>
.record-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: var(--bg-color);
  border-radius: var(--border-radius-md);
  gap: 16px;
}

.record-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.record-icon.green {
  background-color: var(--pastel-green);
  color: #2e7d32;
}

.record-icon.blue {
  background-color: var(--pastel-blue);
  color: #1565c0;
}

.record-info {
  flex: 1;
}

.record-info h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.record-info .time {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 600;
}

.record-amount {
  font-size: 18px;
  font-weight: 800;
  color: var(--dark-charcoal);
  background-color: #fff;
  padding: 8px 16px;
  border-radius: var(--border-radius-pill);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .record-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .record-amount {
    align-self: flex-end;
    font-size: 16px;
    padding: 6px 12px;
  }
}
</style>
