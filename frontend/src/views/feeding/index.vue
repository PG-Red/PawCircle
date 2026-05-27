<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Select } from '@element-plus/icons-vue';
import { petApi, type Pet, type PetRoutine, type RoutineRecord } from '@/api/index';
import { useRouter } from 'vue-router';
import RoutineManageDialog from './components/RoutineManageDialog.vue';
import HistoryDialog from './components/HistoryDialog.vue';

const router = useRouter();

const currentDate = ref(new Date());
const loading = ref(false);
const routineDialogVisible = ref(false);
const historyDialogVisible = ref(false);

const pets = ref<Pet[]>([]);
const selectedPetId = ref<number | 'all'>('all');

const routines = ref<(PetRoutine & { petName: string })[]>([]);
const monthRecords = ref<RoutineRecord[]>([]);

// 按天缓存的记录 { "YYYY-MM-DD": RoutineRecord[] }
const recordsMap = computed(() => {
  const map: Record<string, RoutineRecord[]> = {};
  monthRecords.value.forEach(r => {
    const d = r.record_date.slice(0, 10);
    if (!map[d]) map[d] = [];
    map[d].push(r);
  });
  return map;
});

const todayString = computed(() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
});

const selectedDayStr = computed(() => {
  const d = currentDate.value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
});

const currentTitle = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
});

const prevMonth = () => {
  const d = new Date(currentDate.value);
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  currentDate.value = d;
};

const nextMonth = () => {
  const d = new Date(currentDate.value);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  currentDate.value = d;
};

const loadPetsAndRoutines = async () => {
  try {
    // Determine the current month string (YYYY-MM)
    const y = currentDate.value.getFullYear();
    const m = String(currentDate.value.getMonth() + 1).padStart(2, '0');
    const monthStr = `${y}-${m}`;

    if (pets.value.length === 0) {
      const res = await petApi.getPets();
      pets.value = res.data;
    }
    
    // Load routines for all pets
    const routinesPromises = pets.value.map(async p => {
      const r = await petApi.getRoutines(p.id, monthStr);
      return r.data.map(rt => ({ ...rt, petName: p.name }));
    });
    
    const routinesArrays = await Promise.all(routinesPromises);
    routines.value = routinesArrays.flat().sort((a, b) => a.task_time.localeCompare(b.task_time));
    
  } catch (err) {
    ElMessage.error('加载宠物或规律失败');
  }
};

const loadMonthRecords = async (silent = false) => {
  if (pets.value.length === 0) return;
  
  const y = currentDate.value.getFullYear();
  const m = currentDate.value.getMonth() + 1;
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  if (!silent) loading.value = true;
  try {
    const promises = pets.value.map(p => petApi.getRoutineRecords(p.id, startDate, endDate));
    const resArrays = await Promise.all(promises);
    monthRecords.value = resArrays.map(res => res.data).flat();
  } catch (err) {
    ElMessage.error('加载打卡记录失败');
  } finally {
    if (!silent) loading.value = false;
  }
};

onMounted(async () => {
  await loadPetsAndRoutines();
  await loadMonthRecords();
});

watch(() => currentTitle.value, () => {
  loadPetsAndRoutines();
  loadMonthRecords();
});

// 检查某个规律任务在指定日期是否需要执行
const isRoutineActiveOnDate = (routine: any, dateStr: string) => {
  const current = new Date(dateStr);
  current.setHours(0, 0, 0, 0);

  // 1. 检查 start_date
  if (routine.start_date) {
    const start = new Date(routine.start_date);
    start.setHours(0, 0, 0, 0);
    if (current < start) return false;
  }

  // 2. 检查 end_date
  if (routine.end_date) {
    const end = new Date(routine.end_date);
    end.setHours(0, 0, 0, 0);
    if (current > end) return false;
  }

  // 3. 根据频率类型判断
  if (routine.frequency_type === 'once') {
    return routine.frequency_value === dateStr;
  } else if (routine.frequency_type === 'daily') {
    return true;
  } else if (routine.frequency_type === 'interval') {
    if (!routine.start_date) return true; // fallback
    const start = new Date(routine.start_date);
    start.setHours(0, 0, 0, 0);
    const diffTime = current.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const intervalDays = parseInt(routine.frequency_value) || 1;
    return diffDays % intervalDays === 0;
  }
  
  return true;
};

// 计算选定日期的任务状态
const selectedDayTasks = computed(() => {
  const dateStr = selectedDayStr.value;
  const completedRecords = recordsMap.value[dateStr] || [];
  
  if (selectedPetId.value === 'all') {
    // 聚合任务逻辑：名称、时间、类型相同的视为同一个通用任务
    const grouped = new Map<string, any>();
    
    routines.value.forEach(routine => {
      if (!isRoutineActiveOnDate(routine, dateStr)) {
        return; // skip this task for this day
      }
      
      const key = `${routine.title}_${routine.task_time}_${routine.task_type}`;
      const isCompleted = completedRecords.some(r => r.routine_id === routine.id && r.pet_id === routine.pet_id);
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          title: routine.title,
          task_time: routine.task_time,
          task_type: routine.task_type,
          isCommon: true,
          subTasks: [],
          isCompleted: true // 初始设为true，如果有一个没完成就变为false
        });
      }
      
      const group = grouped.get(key)!;
      group.subTasks.push({
        ...routine,
        isCompleted
      });
      if (!isCompleted) {
        group.isCompleted = false;
      }
    });
    
    return Array.from(grouped.values())
      .filter(g => pets.value.length === 0 || g.subTasks.length === pets.value.length)
      .map(g => {
      // 聚合的显示信息
      return {
        ...g,
        id: g.key,
        petName: '所有宠物'
      };
    });
  } else {
    // 单一宠物的原有逻辑
    return routines.value
      .filter(routine => {
        if (routine.pet_id !== selectedPetId.value) return false;
        return isRoutineActiveOnDate(routine, dateStr);
      })
      .map(routine => {
        const isCompleted = completedRecords.some(r => r.routine_id === routine.id && r.pet_id === routine.pet_id);
        return {
          ...routine,
          isCompleted,
          isCommon: false
        };
      });
  }
});

const getDayStatus = (day: string) => {
  // 如果该天有记录，就显示一个小圆点
  return !!recordsMap.value[day]?.length;
};

const getDayAllCompletedStatus = (dayStr: string) => {
  if (pets.value.length === 0) return false;
  
  // 某天安排的所有任务
  const dayRoutines = routines.value.filter(routine => isRoutineActiveOnDate(routine, dayStr));

  if (dayRoutines.length === 0) return false;

  const completedRecords = recordsMap.value[dayStr] || [];
  
  // 检查是否每个 dayRoutines 都在 completedRecords 中
  return dayRoutines.every(routine => {
    return completedRecords.some(r => r.routine_id === routine.id && r.pet_id === routine.pet_id);
  });
};

// 检查该天是否存在非通用的“特定宠物独有打卡任务”
const hasSpecificTask = (dayStr: string) => {
  if (pets.value.length <= 1) return false; // 如果只有1个宠物，那它肯定也是通用的，或者不存在差别
  
  // 找出当天的所有任务
  const dayRoutines = routines.value.filter(routine => isRoutineActiveOnDate(routine, dayStr));

  // 按照 名称+时间+类型 进行分组，统计拥有相同任务的宠物数量
  const counts = new Map<string, number>();
  for (const r of dayRoutines) {
    const key = `${r.title}_${r.task_time}_${r.task_type}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // 如果某个任务的数量 小于 宠物总数，说明它不是所有宠物共有的（独属于1只或部分）
  const totalPets = pets.value.length;
  for (const count of counts.values()) {
    if (count < totalPets) return true;
  }
  return false;
};

const toggleTask = async (task: any) => {
  const dateStr = selectedDayStr.value;
  const newStatus = !task.isCompleted;
  
  // 乐观更新
  task.isCompleted = newStatus;
  
  try {
    if (task.isCommon && task.subTasks) {
      // 聚合任务（所有宠物），批量发出请求
      const promises = task.subTasks.map((sub: any) => {
        // 同步乐观更新子状态
        sub.isCompleted = newStatus;
        return petApi.toggleRoutineRecord(sub.pet_id, sub.id, dateStr, newStatus);
      });
      await Promise.all(promises);
    } else {
      // 单个宠物任务
      await petApi.toggleRoutineRecord(task.pet_id, task.id, dateStr, newStatus);
    }
    // 后台静默刷新记录以保持同步
    await loadMonthRecords(true);
    
    if (newStatus) {
      ElMessage.success('打卡成功！');
    }
  } catch {
    task.isCompleted = !newStatus; // 恢复
    ElMessage.error('操作失败，请重试');
  }
};

const goToProfile = () => {
  router.push('/profiles');
};
</script>

<template>
  <div class="routine-container">
    <el-row :gutter="30">
      <el-col :xs="24" :sm="24" :md="10">
        <div class="calendar-wrapper">
          <div class="card-header">
            <h3>打卡日历</h3>
          </div>
          <el-calendar v-model="currentDate" class="custom-calendar">
            <template #header>
              <div class="cal-nav">
                <button class="nav-btn" @click="prevMonth">&#8592;</button>
                <span class="cal-title">{{ currentTitle }}</span>
                <button class="nav-btn" @click="nextMonth">&#8594;</button>
              </div>
            </template>
            <template #date-cell="{ data }">
              <div class="calendar-cell" :class="{ 'is-today': data.day === todayString }">
                <span class="day">{{ data.day.split('-').slice(-1)[0] }}</span>
                <div class="day-indicators">
                  <el-icon v-if="getDayAllCompletedStatus(data.day)" class="day-check-icon"><Select /></el-icon>
                  <template v-else>
                    <div v-if="hasSpecificTask(data.day)" class="day-dot red"></div>
                    <div v-else-if="getDayStatus(data.day)" class="day-dot green"></div>
                  </template>
                </div>
              </div>
            </template>
          </el-calendar>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="14">
        <div class="tasks-wrapper" v-loading="loading">
          <div class="card-header">
            <h3>{{ selectedDayStr }}</h3>
            <div v-if="pets.length > 0" class="header-actions">
              <el-button plain style="font-size: 14px; font-weight: bold; padding: 8px 16px; height: auto;" @click="historyDialogVisible = true">历史记录</el-button>
              <el-button type="primary" plain style="font-size: 14px; font-weight: bold; padding: 8px 16px; height: auto;" @click="routineDialogVisible = true">设置打卡活动</el-button>
            </div>
          </div>
          
          <!-- 现代化药丸型宠物筛选器 -->
          <div class="task-filters" v-if="pets.length > 0">
            <div class="filter-pill" :class="{ active: selectedPetId === 'all' }" @click="selectedPetId = 'all'">
              <div class="pill-icon">🌟</div>
              <span>所有宠物</span>
            </div>
            <div 
              v-for="pet in pets" 
              :key="pet.id" 
              class="filter-pill" 
              :class="{ active: selectedPetId === pet.id }"
              @click="selectedPetId = pet.id"
            >
              <el-avatar :size="24" :src="pet.image || ''" class="pill-avatar">
                {{ pet.name.charAt(0) }}
              </el-avatar>
              <span>{{ pet.name }}</span>
            </div>
          </div>
          
          <div class="task-list">
            <div v-if="pets.length === 0" class="empty-state">
              暂无宠物，请先到档案页添加宠物
              <br/>
              <el-button type="primary" style="margin-top: 12px" @click="goToProfile">去添加</el-button>
            </div>
            <div v-else-if="routines.length === 0" class="empty-state">
              还没为宠物设置任何打卡活动哦～
              <br/>
              <span style="font-size: 13px; color: #999; margin-top: 8px; display: inline-block;">点击上方按钮设置打卡活动</span>
            </div>
            <div v-else-if="selectedDayTasks.length === 0" class="empty-state">
              今天没有需要完成的任务
            </div>
            
            <template v-else>
              <div 
                v-for="task in selectedDayTasks" 
                :key="task.id" 
                class="task-item"
                :class="{ 'is-completed': task.isCompleted }"
                @click="toggleTask(task)"
              >
                <div class="task-check" :class="{ 'checked': task.isCompleted }">
                  <el-icon v-if="task.isCompleted"><Select /></el-icon>
                </div>
                <div class="task-content">
                  <div class="task-header">
                    <span class="task-title">{{ task.title }}</span>
                    <span class="task-pet">{{ task.petName }}</span>
                  </div>
                  <div class="task-meta">
                    <span class="task-time">{{ task.task_time }}</span>
                    <span class="task-type" :class="`type-${task.task_type}`">{{ task.task_type }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <RoutineManageDialog 
      v-model="routineDialogVisible" 
      :pets="pets" 
      :default-pet-id="selectedPetId === 'all' ? -1 : selectedPetId"
      :selected-date="selectedDayStr"
      @saved="loadPetsAndRoutines(); loadMonthRecords(true);"
    />

    <HistoryDialog
      v-model="historyDialogVisible"
      :pets="pets"
      @deleted="loadPetsAndRoutines(); loadMonthRecords(true);"
    />
  </div>
</template>

<style scoped>
.routine-container {
  padding-bottom: 40px;
}

.calendar-wrapper,
.tasks-wrapper {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}

.tasks-wrapper {
  min-height: 400px;
}

.task-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 4px; /* 防止滚动条遮挡 */
}

.task-filters::-webkit-scrollbar {
  height: 4px;
}

.task-filters::-webkit-scrollbar-thumb {
  background: #eee;
  border-radius: 4px;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 6px 8px;
  background-color: #f5f5f5;
  border: 1px solid #eaeaea;
  border-radius: 100px;
  cursor: pointer;
  white-space: nowrap;
}

.filter-pill:hover {
  background-color: #eee;
}

.filter-pill.active {
  background-color: #fff9e6;
  border-color: var(--primary-yellow);
  box-shadow: 0 2px 8px rgba(252, 211, 113, 0.2);
}

.filter-pill span {
  font-size: 14px;
  font-weight: 700;
  color: #666;
}

.filter-pill.active span {
  color: var(--dark-charcoal);
}

.pill-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 50%;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.pill-avatar {
  background-color: #fff;
  color: #666;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #eee;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-weight: 600;
  line-height: 1.6;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fdfbf7;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: var(--primary-yellow);
  box-shadow: 0 4px 12px rgba(252, 211, 113, 0.15);
}

.task-check {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
  flex-shrink: 0;
}

.task-check.checked {
  background-color: var(--pastel-green);
  border-color: var(--pastel-green);
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.task-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--dark-charcoal);
  transition: color 0.2s;
}

.task-pet {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-yellow);
  background: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(252, 211, 113, 0.5);
}

.task-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-time {
  font-size: 14px;
  font-weight: 700;
  color: #666;
}

.task-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 700;
  background: #eee;
  color: #666;
}

.task-type.type-饮食 { background: #fee2e2; color: #ef4444; }
.task-type.type-出游 { background: #dcfce7; color: #22c55e; }
.task-type.type-洗护 { background: #e0f2fe; color: #0ea5e9; }
.task-type.type-医疗 { background: #f3e8ff; color: #a855f7; }

/* Calendar styles preserved */
:deep(.el-calendar) { background-color: transparent; }
:deep(.el-calendar__header) { border-bottom: none; padding: 0 0 20px; }
.cal-nav { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 4px; }
.cal-title { font-size: 15px; font-weight: 800; color: var(--dark-charcoal); }
.nav-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--dark-charcoal); padding: 4px 10px; border-radius: var(--border-radius-md); transition: background 0.15s; }
.nav-btn:hover { background: #fcd37122; }
:deep(.el-calendar__body) { padding: 0; }
:deep(.el-calendar-table td) { border: none; }
:deep(.el-calendar-table) { border-left: none; border: none; }
:deep(.el-calendar-table th) { border: none; border-left: none; border-bottom: none; }
:deep(.el-calendar-table tr td:first-child) { border-left: none; }
:deep(.el-calendar-table td.is-selected) { background-color: transparent; }
:deep(.el-calendar-table .el-calendar-day:hover) { background-color: transparent; }
:deep(.el-calendar-table .el-calendar-day) { height: 60px; display: flex; align-items: center; justify-content: center; border-radius: var(--border-radius-md); }
:deep(.el-calendar-table td.is-selected .el-calendar-day) { --el-calendar-selected-bg-color: transparent; background-color: transparent; color: inherit; }

:deep(.el-calendar-table td.is-selected .calendar-cell) {
  background-color: #fcd371;
  box-shadow: 0 0 0 4px #fcd371;
  color: #fff;
}

:deep(.el-calendar-table td.is-selected .calendar-cell.is-today) {
  color: #fff;
}

:deep(.el-calendar-table td.is-selected .calendar-cell.is-today::before) {
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
  transition: background-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.calendar-cell:hover {
  box-shadow: 0 0 0 4px #fcd371;
}

.calendar-cell:active {
  box-shadow: 0 0 0 4px #fcd371;
}

.day-indicators {
  position: absolute;
  bottom: 2px;
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
}

.day-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.day-dot.green {
  background-color: var(--pastel-green);
}

.day-dot.red {
  background-color: #ff6b6b;
}

.day-check-icon {
  font-size: 11px;
  color: var(--pastel-green);
  font-weight: 900;
  margin-top: -2px;
}

.calendar-cell.is-today {
  color: var(--primary-yellow);
  font-weight: bold;
}

@media (max-width: 768px) {
  .calendar-wrapper, .tasks-wrapper { padding: 20px; margin-bottom: 20px; }
  :deep(.el-calendar-table .el-calendar-day) { height: 40px; }
  .calendar-cell { width: 30px; height: 30px; font-size: 14px; }
}
</style>
