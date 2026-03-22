<template>
  <div class="feeding-container">
    <el-row :gutter="30">
      <el-col :xs="24" :sm="24" :md="10">
        <div class="calendar-wrapper">
          <div class="card-header">
            <h3>日历</h3>
            <el-button class="check-in-btn">打卡</el-button>
          </div>
          <el-calendar v-model="currentDate" class="custom-calendar">
            <template #date-cell="{ data }">
              <div class="calendar-cell" :class="{ 'has-record': getFeedingStatus(data.day) }">
                <span class="day">{{ data.day.split('-').slice(-1)[0] }}</span>
              </div>
            </template>
          </el-calendar>
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="14">
        <div class="records-wrapper">
          <div class="card-header">
            <h3>最近记录</h3>
          </div>
          
          <div class="record-list">
            <div v-for="(record, index) in records" :key="index" class="record-item">
              <div class="record-icon" :class="record.type === 'Food' ? 'green' : 'blue'">
                <el-icon><Bowl v-if="record.type === 'Food'" /><Goblet v-else /></el-icon>
              </div>
              <div class="record-info">
                <h4>{{ record.petName }} - {{ record.food }}</h4>
                <span class="time">{{ record.date }}</span>
              </div>
              <div class="record-amount">
                {{ record.amount }}
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Bowl, Goblet } from '@element-plus/icons-vue';

const currentDate = ref(new Date());

const records = ref([
  {
    date: '今天, 08:30 AM',
    petName: 'Max',
    type: 'Food',
    food: '皇家幼犬粮',
    amount: '100g'
  },
  {
    date: '今天, 09:00 AM',
    petName: 'Luna',
    type: 'Food',
    food: '渴望猫粮',
    amount: '50g'
  },
  {
    date: '昨天, 06:30 PM',
    petName: 'Max',
    type: 'Water',
    food: '新鲜饮水',
    amount: '200ml'
  }
]);

const getFeedingStatus = (day: string) => {
  // Mock logic for dots
  return parseInt(day.split('-')[2]) % 3 === 0;
};
</script>

<style scoped>
.feeding-container {
  padding-bottom: 40px;
}

.header-section {
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--dark-charcoal);
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 600;
}

.calendar-wrapper, .records-wrapper {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.check-in-btn {
  background-color: var(--primary-yellow);
  border: none;
  color: var(--dark-charcoal);
  font-weight: 800;
  border-radius: var(--border-radius-pill);
}

/* Calendar Overrides */
:deep(.el-calendar) {
  background-color: transparent;
}

:deep(.el-calendar__header) {
  border-bottom: none;
  padding: 0 0 20px 0;
}

:deep(.el-calendar__body) {
  padding: 0;
}

:deep(.el-calendar-table td) {
  border: none;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-md);
}

:deep(.el-calendar-table td.is-selected .el-calendar-day) {
  background-color: var(--dark-charcoal);
  color: #fff;
}

.calendar-cell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  position: relative;
  font-weight: 700;
}

.calendar-cell.has-record::after {
  content: '';
  position: absolute;
  bottom: 2px;
  width: 6px;
  height: 6px;
  background-color: var(--pastel-green);
  border-radius: 50%;
}

:deep(.el-calendar-table td.is-selected) .calendar-cell.has-record::after {
  background-color: var(--primary-yellow);
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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
  color: #2E7D32;
}

.record-icon.blue {
  background-color: var(--pastel-blue);
  color: #1565C0;
}

.record-info {
  flex: 1;
}

.record-info h4 {
  margin: 0 0 4px 0;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }
  .calendar-wrapper, .records-wrapper {
    padding: 20px;
    margin-bottom: 20px;
  }
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
  :deep(.el-calendar-table .el-calendar-day) {
    height: 40px;
  }
  .calendar-cell {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
}
</style>
