<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import RecordItem from './components/RecordItem.vue';
import { feedingApi, petApi, type Pet, type FeedingRecord } from '@/api/index';

const currentDate = ref(new Date());
const loadingRecords = ref(false);
const checkInVisible = ref(false);
const checkingIn = ref(false);

const pets = ref<Pet[]>([]);

type UiRecord = {
  id: number;
  date: string;
  petName: string;
  type: 'Food' | 'Water';
  food: string;
  amount: string;
  createdAt: string;
  dayKey: string;
};

const records = ref<UiRecord[]>([]);
const allRecords = ref<UiRecord[]>([]);
const checkedDayMap = ref<Record<string, boolean>>({});

const form = reactive({
  pet_id: undefined as number | undefined,
  type: 'Food' as 'Food' | 'Water',
  food_name: '',
  amount: '',
  notes: '',
});

const amountValue = ref(80);
const amountUnit = ref<'g' | 'ml'>('g');

const syncAmountToForm = () => {
  form.amount = `${amountValue.value}${amountUnit.value}`;
};

watch([amountValue, amountUnit], syncAmountToForm, { immediate: true });

watch(() => form.type, (type) => {
  amountUnit.value = type === 'Food' ? 'g' : 'ml';
  amountValue.value = type === 'Food' ? 80 : 150;
});

const changeAmount = (delta: number) => {
  const next = amountValue.value + delta;
  amountValue.value = Math.min(2000, Math.max(10, next));
};

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

const currentTitle = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
});

const toDayKey = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatRecordTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const todayKey = toDayKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = toDayKey(yesterday.toISOString());
  const recordKey = toDayKey(dateStr);

  const hm = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (recordKey === todayKey) return `今天, ${hm}`;
  if (recordKey === yesterdayKey) return `昨天, ${hm}`;
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getFeedingStatus = (day: string) => !!checkedDayMap.value[day];

const selectedDayKey = computed(() => toDayKey(currentDate.value.toISOString()));
const selectedDayRecords = computed(() =>
  allRecords.value.filter(r => r.dayKey === selectedDayKey.value)
);
const selectedDayTitle = computed(() => {
  const d = currentDate.value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
});

const loadPets = async () => {
  try {
    const res = await petApi.getPets();
    pets.value = res.data;
    if (!form.pet_id && pets.value.length > 0) {
      form.pet_id = pets.value[0].id;
    }
  } catch {
    ElMessage.error('加载宠物失败');
  }
};

const loadRecords = async () => {
  if (pets.value.length === 0) {
    allRecords.value = [];
    records.value = [];
    checkedDayMap.value = {};
    return;
  }

  loadingRecords.value = true;
  try {
    const result = await Promise.all(
      pets.value.map(async (pet) => {
        const res = await feedingApi.getFeedingRecords(pet.id, 1, 100);
        return { petName: pet.name, items: res.data.items };
      })
    );

    const mergedRecords: UiRecord[] = [];
    result.forEach(({ petName, items }) => {
      items.forEach((item: FeedingRecord) => {
        mergedRecords.push({
          id: item.id,
          date: formatRecordTime(item.created_at),
          petName,
          type: item.type,
          food: item.food_name,
          amount: item.amount,
          createdAt: item.created_at,
          dayKey: toDayKey(item.created_at),
        });
      });
    });

    mergedRecords.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    allRecords.value = mergedRecords;
    records.value = mergedRecords.slice(0, 5);

    const dayMap: Record<string, boolean> = {};
    mergedRecords.forEach((r) => { dayMap[r.dayKey] = true; });
    checkedDayMap.value = dayMap;
  } catch {
    ElMessage.error('加载喂养记录失败');
  } finally {
    loadingRecords.value = false;
  }
};

const openCheckIn = () => {
  if (pets.value.length === 0) {
    ElMessage.warning('请先添加宠物档案');
    return;
  }
  checkInVisible.value = true;
};

const submitCheckIn = async () => {
  if (!form.pet_id) {
    ElMessage.warning('请选择宠物');
    return;
  }
  if (!form.food_name.trim() || !form.amount.trim()) {
    ElMessage.warning('请填写食物/水和数量');
    return;
  }

  checkingIn.value = true;
  try {
    await feedingApi.addFeedingRecord(form.pet_id, {
      type: form.type,
      food_name: form.food_name.trim(),
      amount: form.amount.trim(),
      notes: form.notes.trim(),
    });
    ElMessage.success('打卡成功');
    checkInVisible.value = false;
    form.food_name = '';
    form.notes = '';
    amountValue.value = form.type === 'Food' ? 80 : 150;
    syncAmountToForm();
    currentDate.value = new Date();
    await loadRecords();
  } catch {
    ElMessage.error('打卡失败，请重试');
  } finally {
    checkingIn.value = false;
  }
};

onMounted(async () => {
  await loadPets();
  await loadRecords();
});
</script>

<template>
  <div class="feeding-container">
    <el-row :gutter="30">
      <el-col :xs="24" :sm="24" :md="10">
        <div class="calendar-wrapper">
          <div class="card-header">
            <h3>日历</h3>
            <el-button class="check-in-btn" @click="openCheckIn">打卡</el-button>
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
              <div class="calendar-cell" :class="{ 'has-record': getFeedingStatus(data.day) }">
                <span class="day">{{ data.day.split('-').slice(-1)[0] }}</span>
              </div>
            </template>
          </el-calendar>
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="14">
        <div class="selected-day-wrapper">
          <div class="card-header">
            <h3>当前日期记录</h3>
            <span class="selected-day-text">{{ selectedDayTitle }}</span>
          </div>
          <div class="record-list">
            <RecordItem v-for="r in selectedDayRecords" :key="`selected-${r.id}`" :record="r" />
            <div v-if="selectedDayRecords.length === 0" class="empty-records">该日期暂无打卡记录</div>
          </div>
        </div>

        <div class="records-wrapper">
          <div class="card-header"><h3>最近记录</h3></div>
          <div class="record-list" v-loading="loadingRecords">
            <RecordItem v-for="r in records" :key="r.id" :record="r" />
            <div v-if="!loadingRecords && records.length === 0" class="empty-records">暂无喂养记录</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="checkInVisible" title="喂养打卡" width="460px" destroy-on-close>
      <el-form label-position="top" class="checkin-form">
        <el-form-item label="宠物">
          <el-select v-model="form.pet_id" placeholder="请选择宠物" style="width: 100%">
            <el-option v-for="pet in pets" :key="pet.id" :label="pet.name" :value="pet.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio-button label="Food">喂食</el-radio-button>
            <el-radio-button label="Water">喂水</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.type === 'Food' ? '食物名称' : '饮水说明'">
          <el-input
            v-model="form.food_name"
            :placeholder="form.type === 'Food' ? '例如：幼猫粮' : '例如：温水 / 自动饮水机换水'"
          />
        </el-form-item>
        <el-form-item label="数量">
          <div class="amount-counter">
            <button type="button" class="counter-btn" @click="changeAmount(-10)">-</button>
            <div class="counter-value">{{ amountValue }} {{ amountUnit }}</div>
            <button type="button" class="counter-btn" @click="changeAmount(10)">+</button>
          </div>
        </el-form-item>
        <el-form-item label="备注（可选）">
          <div class="note-wrapper">
            <textarea
              v-model="form.notes"
              class="note-textarea"
              placeholder="可记录食欲、状态等"
              :maxlength="200"
            ></textarea>
            <span class="note-count" :class="{ 'near-limit': form.notes.length >= 180 }">
              {{ form.notes.length }}/200
            </span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="checkin-footer">
          <el-button class="cancel-btn" @click="checkInVisible = false">取消</el-button>
          <el-button type="primary" class="save-btn" :loading="checkingIn" @click="submitCheckIn">确认打卡</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.feeding-container {
  padding-bottom: 40px;
}

.calendar-wrapper,
.records-wrapper,
.selected-day-wrapper {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
}

.selected-day-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--bg-color);
  border-radius: var(--border-radius-pill);
  padding: 4px 10px;
}

.empty-records {
  text-align: center;
  padding: 16px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
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

.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 4px;
}

.cal-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.nav-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--dark-charcoal);
  padding: 4px 10px;
  border-radius: var(--border-radius-md);
  transition: background 0.15s;
}

.nav-btn:hover {
  background: #fcd37122;
}

:deep(.el-calendar__body) {
  padding: 0;
}

:deep(.el-calendar-table td) {
  border: none;
}

:deep(.el-calendar-table) {
  border-left: none;
  border: none;
}

:deep(.el-calendar-table th) {
  border: none;
  border-left: none;
  border-bottom: none;
}

:deep(.el-calendar-table tr td:first-child) {
  border-left: none;
}

:deep(.el-calendar-table td.is-selected) {
  background-color: transparent;
}

:deep(.el-calendar-table .el-calendar-day:hover) {
  background-color: transparent;
}

:deep(.el-calendar-table .el-calendar-day) {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-md);
}

:deep(.el-calendar-table td.is-selected .el-calendar-day) {
  --el-calendar-selected-bg-color: transparent;
  background-color: transparent;
  color: inherit;
}



:deep(.el-calendar-table td.is-selected .calendar-cell) {
  background-color: #fcd371;
  box-shadow: 0 0 0 4px #fcd371;
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

.amount-counter {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.counter-btn {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-size: 22px;
  font-weight: 900;
  cursor: pointer;
  line-height: 1;
  transition: transform 0.12s, filter 0.2s;
}

.counter-btn:hover {
  filter: brightness(0.95);
}

.counter-btn:active {
  transform: scale(0.96);
}

.counter-value {
  flex: 1;
  height: 42px;
  border-radius: var(--border-radius-pill);
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: var(--dark-charcoal);
  font-weight: 800;
  font-size: 16px;
}

.note-wrapper {
  position: relative;
  width: 100%;
}

.note-textarea {
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

.note-textarea::placeholder {
  color: var(--text-secondary);
  font-weight: 500;
}

.note-textarea:focus {
  border-color: var(--primary-yellow);
  background-color: #fdfbf7;
}

.note-count {
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  pointer-events: none;
}

.note-count.near-limit {
  color: #FA8C16;
}

.checkin-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
  transition: background-color 0.2s, box-shadow 0.2s;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  background-color: #fdfbf7 !important;
  box-shadow: 0 0 0 1px var(--primary-yellow) inset !important;
}

:deep(.el-textarea__inner:focus) {
  background-color: #fdfbf7 !important;
  box-shadow: 0 0 0 1px var(--primary-yellow) inset !important;
}

:deep(.el-radio-button__inner) {
  font-weight: 700;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: var(--primary-yellow) !important;
  border-color: var(--primary-yellow) !important;
  color: var(--dark-charcoal) !important;
  box-shadow: -1px 0 0 0 var(--primary-yellow) !important;
}

:deep(.el-radio-button__inner:hover) {
  color: var(--dark-charcoal);
}

@media (max-width: 768px) {
  .calendar-wrapper,
  .records-wrapper,
  .selected-day-wrapper {
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
