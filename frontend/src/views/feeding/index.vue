<script setup lang="ts">
import { ref } from 'vue';
import RecordItem from './RecordItem.vue';

const currentDate = ref(new Date());

const records = ref([
  { date: '今天, 08:30 AM', petName: 'Max',  type: 'Food'  as const, food: '皇家幼犬粮', amount: '100g'  },
  { date: '今天, 09:00 AM', petName: 'Luna', type: 'Food'  as const, food: '渴望猫粮',   amount: '50g'   },
  { date: '昨天, 06:30 PM', petName: 'Max',  type: 'Water' as const, food: '新鲜饮水',   amount: '200ml' },
]);

const getFeedingStatus = (day: string) => parseInt(day.split('-')[2]) % 3 === 0;
</script>

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
          <div class="card-header"><h3>最近记录</h3></div>
          <div class="record-list">
            <RecordItem v-for="(r, i) in records" :key="i" :record="r" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.feeding-container {
  padding-bottom: 40px;
}

.calendar-wrapper,
.records-wrapper {
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

:deep(.el-calendar) {
  background-color: transparent;
}

:deep(.el-calendar__header) {
  border-bottom: none;
  padding: 0 0 20px;
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
  background-color: transparent;
  color: inherit;
}

:deep(.el-calendar-table td.is-today .el-calendar-day) {
  background-color: transparent;
  color: inherit;
}

:deep(.el-calendar-table td.is-selected .calendar-cell) {
  background-color: var(--primary-yellow);
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
  transition: background-color 0.2s;
  cursor: pointer;
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

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 768px) {
  .calendar-wrapper,
  .records-wrapper {
    padding: 20px;
    margin-bottom: 20px;
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
