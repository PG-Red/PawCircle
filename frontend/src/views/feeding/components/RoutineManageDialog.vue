<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { petApi, type Pet } from '@/api/index';

const props = defineProps<{ 
  modelValue: boolean; 
  pets: Pet[]; 
  defaultPetId?: number | null;
  selectedDate: string;
}>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>();

const visible = ref(props.modelValue);

const isCommonMode = computed(() => props.defaultPetId === -1 || props.defaultPetId == null);
const targetPetId = computed(() => isCommonMode.value ? -1 : props.defaultPetId!);

const targetPetName = computed(() => {
  if (isCommonMode.value) return '所有宠物';
  const pet = props.pets.find(p => p.id === targetPetId.value);
  if (!pet) return '';
  return pet.name;
});

watch(() => props.modelValue, v => { 
  visible.value = v; 
  if (v) {
    loadRoutines();
  }
});
watch(visible, v => emit('update:modelValue', v));

interface LocalRoutine {
  _localId: string;
  id?: number;
  subTasks?: { pet_id: number; id: number }[];
  pet_id: number; // -1 表示通用
  task_type: string;
  title: string;
  task_time: string;
  frequency_type: string; // 'daily', 'once', 'interval'
  frequency_value: string;
  start_date: string;
  end_date: string | null;
  has_end_date: boolean;
  interval_days: number;
}

const localRoutines = ref<LocalRoutine[]>([]);
const deletedRoutines = ref<LocalRoutine[]>([]);
const loading = ref(false);
const saving = ref(false);

const taskTypes = ['饮食', '出游', '洗护', '医疗', '其他'];

const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const loadRoutines = async () => {
  if (props.pets.length === 0) return;
  loading.value = true;
  try {
    const monthStr = props.selectedDate.substring(0, 7); // Extract YYYY-MM
    const promises = props.pets.map(p => petApi.getRoutines(p.id, monthStr));
    const results = await Promise.all(promises);
    const flatRoutines = results.flat().map(res => res.data).flat();

    const commonMap = new Map<string, any[]>();
    flatRoutines.forEach(r => {
      const key = `${r.title}_${r.task_time}_${r.task_type}_${r.frequency_type}_${r.frequency_value}`;
      if (!commonMap.has(key)) commonMap.set(key, []);
      commonMap.get(key)!.push(r);
    });

    const parsedRoutines: LocalRoutine[] = [];
    const totalPets = props.pets.length;
    const isMultiPet = totalPets > 1;

    for (const group of commonMap.values()) {
      const isCommon = group.length === totalPets && totalPets > 0;
      
      if (isCommonMode.value) {
        if (isCommon || !isMultiPet) {
          const freqType = group[0].frequency_type || 'daily';
          let mappedFreqType = freqType;
          let interval_days = 1;
          if (freqType === 'interval') {
            interval_days = parseInt(group[0].frequency_value) || 1;
            if (interval_days === 7) mappedFreqType = 'weekly';
            else if (interval_days === 14) mappedFreqType = 'biweekly';
            else mappedFreqType = 'custom';
          }
          parsedRoutines.push({
            _localId: Math.random().toString(),
            subTasks: group.map(r => ({ pet_id: r.pet_id, id: r.id })),
            pet_id: -1,
            task_type: group[0].task_type,
            title: group[0].title,
            task_time: group[0].task_time,
            frequency_type: mappedFreqType,
            frequency_value: group[0].frequency_value || '1,2,3,4,5,6,7',
            start_date: group[0].start_date || props.selectedDate,
            end_date: group[0].end_date || null,
            has_end_date: !!group[0].end_date,
            interval_days
          });
        }
      } else {
        const specificRoutine = group.find(r => r.pet_id === targetPetId.value);
        if (specificRoutine) {
          if (isCommon && isMultiPet) continue;
          
          // 仅展示适用于选中日期的活动（此处只做最基础的每日/单次校验，间隔或带结束日期的也让它展示在对应的日期里，由父组件过滤其实更准确，但这里先尽量回显）
          // 但是如果是弹窗编辑模式，其实应该展示当天“有效”的所有任务
          // 为了简单，我们让父组件 index.vue 过滤，这里只需要保证如果它在今天有效，就回显。
          
          const freqType = specificRoutine.frequency_type || 'daily';
          let mappedFreqType = freqType;
          let interval_days = 1;
          if (freqType === 'interval') {
            interval_days = parseInt(specificRoutine.frequency_value) || 1;
            if (interval_days === 7) mappedFreqType = 'weekly';
            else if (interval_days === 14) mappedFreqType = 'biweekly';
            else mappedFreqType = 'custom';
          }

          parsedRoutines.push({
            _localId: Math.random().toString(),
            id: specificRoutine.id,
            pet_id: specificRoutine.pet_id,
            task_type: specificRoutine.task_type,
            title: specificRoutine.title,
            task_time: specificRoutine.task_time,
            frequency_type: mappedFreqType,
            frequency_value: specificRoutine.frequency_value || '1,2,3,4,5,6,7',
            start_date: specificRoutine.start_date || props.selectedDate,
            end_date: specificRoutine.end_date || null,
            has_end_date: !!specificRoutine.end_date,
            interval_days
          });
        }
      }
    }
    
    localRoutines.value = parsedRoutines;
    deletedRoutines.value = [];
  } catch (e) {
    ElMessage.error('加载打卡活动失败');
  } finally {
    loading.value = false;
  }
};

const addLocalRoutine = () => {
  const isCommon = isCommonMode.value;
  localRoutines.value.push({
    _localId: Math.random().toString(),
    pet_id: targetPetId.value,
    task_type: '饮食',
    title: '',
    task_time: '08:00',
    frequency_type: isCommon ? 'daily' : 'once',
    frequency_value: isCommon ? '1,2,3,4,5,6,7' : props.selectedDate,
    start_date: props.selectedDate,
    end_date: null,
    has_end_date: false,
    interval_days: 7
  });
};

const handleFrequencyChange = (r: LocalRoutine) => {
  if (r.frequency_type === 'once') {
    if (!r.frequency_value || r.frequency_value.includes(',')) {
      r.frequency_value = isCommonMode.value ? getTodayDateStr() : props.selectedDate;
    }
  } else if (r.frequency_type === 'weekly') {
    r.interval_days = 7;
  } else if (r.frequency_type === 'biweekly') {
    r.interval_days = 14;
  } else if (r.frequency_type === 'custom') {
    if (!r.interval_days) r.interval_days = 3;
  }
};

const handleEndDateToggle = (r: LocalRoutine) => {
  if (r.has_end_date && !r.end_date) {
    // 默认给个一个月后的时间
    const d = new Date(r.start_date || new Date());
    d.setMonth(d.getMonth() + 1);
    r.end_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } else if (!r.has_end_date) {
    r.end_date = null;
  }
};

const removeLocalRoutine = (r: LocalRoutine) => {
  const index = localRoutines.value.findIndex(x => x._localId === r._localId);
  if (index !== -1) {
    const removed = localRoutines.value.splice(index, 1)[0];
    if (removed.id || removed.subTasks) {
      deletedRoutines.value.push(removed);
    }
  }
};

const handleSave = async () => {
  for (const r of localRoutines.value) {
    if (!r.title.trim() || !r.task_time) {
      ElMessage.warning('请完整填写所有打卡活动信息');
      return;
    }
    if (r.frequency_type === 'once' && !r.frequency_value) {
      ElMessage.warning('请为单次任务选择日期');
      return;
    }
  }

  saving.value = true;
  try {
    for (const r of deletedRoutines.value) {
      if (r.pet_id === -1 && r.subTasks) {
        const promises = r.subTasks.map(sub => petApi.deleteRoutine(sub.pet_id, sub.id).catch(() => {}));
        await Promise.all(promises);
      } else if (r.id && r.pet_id !== -1) {
        await petApi.deleteRoutine(r.pet_id, r.id).catch(() => {});
      }
    }

    for (const r of localRoutines.value) {
      let freqValue = r.frequency_value;
      let finalFreqType = r.frequency_type;
      
      if (r.frequency_type === 'once') {
        freqValue = r.frequency_value;
      } else if (r.frequency_type === 'weekly' || r.frequency_type === 'biweekly' || r.frequency_type === 'custom') {
        finalFreqType = 'interval';
        freqValue = r.interval_days.toString();
      } else {
        freqValue = '1,2,3,4,5,6,7';
      }

      const routineData = {
        task_type: r.task_type,
        title: r.title.trim(),
        task_time: r.task_time,
        frequency_type: finalFreqType,
        frequency_value: freqValue,
        start_date: finalFreqType !== 'once' ? r.start_date : undefined,
        end_date: r.has_end_date ? r.end_date : null
      };
      
      if (r.pet_id === -1) {
        if (!r.subTasks) {
          const promises = props.pets.map(p => petApi.addRoutine(p.id, routineData));
          await Promise.all(promises);
        } else {
          const promises = r.subTasks.map(sub => petApi.updateRoutine(sub.pet_id, sub.id, routineData));
          await Promise.all(promises);
        }
      } else {
        if (!r.id) {
          await petApi.addRoutine(r.pet_id, routineData);
        } else {
          await petApi.updateRoutine(r.pet_id, r.id, routineData);
        }
      }
    }

    ElMessage.success('打卡设置已保存');
    emit('saved');
    visible.value = false;
  } catch (e) {
    console.error('保存打卡活动失败', e);
    ElMessage.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <el-dialog v-model="visible" :title="`设置打卡活动 (${targetPetName})`" width="860px" align-center class="routine-dialog" :lock-scroll="false">

    <div class="routines-section" v-loading="loading">
      <div v-for="r in localRoutines" :key="r._localId" class="routine-edit-item">
        <div class="routine-main-row">
          <el-select v-model="r.task_type" style="width: 90px; flex-shrink: 0;" placeholder="类型">
            <el-option v-for="t in taskTypes" :key="t" :label="t" :value="t" />
          </el-select>
          <el-select v-model="r.frequency_type" style="width: 100px; flex-shrink: 0;" placeholder="频率" @change="handleFrequencyChange(r)">
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每两周" value="biweekly" />
            <el-option label="自定义天数" value="custom" />
            <el-option label="单次" value="once" />
          </el-select>
          
          <div v-if="['weekly', 'biweekly', 'custom'].includes(r.frequency_type)" style="display: flex; align-items: center; gap: 8px;">
            <el-input-number v-model="r.interval_days" :min="1" :max="365" style="width: 100px;" controls-position="right" :disabled="r.frequency_type !== 'custom'" />
            <span style="font-size: 13px; color: #666; white-space: nowrap;">天一次</span>
          </div>
          
          <el-date-picker 
            v-if="r.frequency_type === 'once'" 
            v-model="r.frequency_value" 
            type="date" 
            value-format="YYYY-MM-DD" 
            placeholder="日期" 
            style="width: 140px; flex-shrink: 0;" 
            :clearable="false" 
          />
          <el-time-picker 
            v-model="r.task_time" 
            format="HH:mm" 
            value-format="HH:mm" 
            style="width: 110px; flex-shrink: 0;" 
            placeholder="时间" 
            :clearable="false" 
          />
          <el-input v-model="r.title" placeholder="任务名称 (如：喂早餐)" style="flex: 1;" />
          <el-button type="danger" link :icon="Delete" @click="removeLocalRoutine(r)"></el-button>
        </div>
        
        <div class="routine-meta-row" v-if="r.frequency_type !== 'once'">
          <div class="meta-item">
            <span class="meta-label">开始日期:</span>
            <el-date-picker 
              v-model="r.start_date" 
              type="date" 
              value-format="YYYY-MM-DD" 
              placeholder="选择开始日期" 
              style="width: 140px;" 
              :clearable="false" 
            />
          </div>
          <div class="meta-item">
            <el-checkbox v-model="r.has_end_date" @change="handleEndDateToggle(r)">结束日期</el-checkbox>
            <el-date-picker 
              v-if="r.has_end_date"
              v-model="r.end_date" 
              type="date" 
              value-format="YYYY-MM-DD" 
              placeholder="选择结束日期" 
              style="width: 140px; margin-left: 8px;" 
              :clearable="false" 
            />
          </div>
        </div>
      </div>

      <el-button plain :icon="Plus" class="add-routine-btn" @click="addLocalRoutine">
        添加一项活动
      </el-button>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="cancel-btn" @click="visible = false">取消</el-button>
        <el-button type="primary" class="save-btn" :loading="saving" @click="handleSave">保存设置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.routines-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 0;
}

.routine-edit-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fcfcfc;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}

.routine-main-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.routine-meta-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 10px;
  border-top: 1px dashed #eaeaea;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-size: 13px;
  color: #666;
  margin-right: 8px;
}

.add-routine-btn {
  width: 100%;
  border-style: dashed;
  color: var(--text-secondary);
  background: transparent;
  height: 40px;
  border-radius: 8px;
}
.add-routine-btn:hover {
  color: var(--primary-yellow);
  border-color: var(--primary-yellow);
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

::deep(.el-input__wrapper) {
  transition: background-color 0.2s, box-shadow 0.2s;
}

::deep(.el-input__wrapper.is-focus) {
  background-color: #fdfbf7 !important;
  box-shadow: 0 0 0 1px var(--primary-yellow) inset !important;
}

::deep(.el-dialog__header) {
  margin-right: 0;
  padding: 24px 32px 8px;
}
::deep(.el-dialog__title) {
  font-weight: 900;
  color: var(--dark-charcoal);
  letter-spacing: -0.2px;
}
::deep(.el-dialog__body) {
  padding: 10px 32px;
}
::deep(.el-dialog__footer) {
  padding: 12px 32px 24px;
}
::deep(.el-dialog) {
  border-radius: var(--border-radius-lg);
}
</style>