<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { petApi, type Pet, type PetRoutine } from '@/api/index';
import { Delete, Clock } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue: boolean;
  pets: Pet[];
}>();

const emit = defineEmits(['update:modelValue', 'deleted']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const loading = ref(false);
const historyRoutines = ref<(PetRoutine & { petName: string })[]>([]);

// 搜索标签
const selectedTag = ref<string>('全部');
const availableTags = computed(() => {
  const types = new Set<string>();
  historyRoutines.value.forEach(r => types.add(r.task_type));
  return ['全部', ...Array.from(types)];
});

const todayString = computed(() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
});

const isRoutineEnded = (routine: PetRoutine) => {
  const today = todayString.value;
  if (routine.end_date && routine.end_date < today) {
    return true;
  }
  if (routine.frequency_type === 'once' && routine.frequency_value < today) {
    return true;
  }
  return false;
};

const loadHistory = async () => {
  if (props.pets.length === 0) return;
  loading.value = true;
  try {
    const promises = props.pets.map(async p => {
      // 不传月份，获取所有活动
      const r = await petApi.getRoutines(p.id);
      return r.data.map(rt => ({ ...rt, petName: p.name }));
    });
    
    const allRoutines = await Promise.all(promises);
    const flatRoutines = allRoutines.flat();
    
    // 过滤出已结束的活动
    historyRoutines.value = flatRoutines
      .filter(r => isRoutineEnded(r))
      .sort((a, b) => {
        // 按照结束日期或执行日期倒序
        const dateA = a.end_date || (a.frequency_type === 'once' ? a.frequency_value : a.start_date || '');
        const dateB = b.end_date || (b.frequency_type === 'once' ? b.frequency_value : b.start_date || '');
        return dateB.localeCompare(dateA);
      });
  } catch (err) {
    ElMessage.error('加载历史记录失败');
  } finally {
    loading.value = false;
  }
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    loadHistory();
    selectedTag.value = '全部';
  }
});

const filteredRoutines = computed(() => {
  if (selectedTag.value === '全部') {
    return historyRoutines.value;
  }
  return historyRoutines.value.filter(r => r.task_type === selectedTag.value);
});

const handleDelete = async (routine: PetRoutine & { petName: string }) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除历史活动 "${routine.title}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    await petApi.deleteRoutine(routine.pet_id, routine.id);
    ElMessage.success('删除成功');
    // 从列表中移除
    historyRoutines.value = historyRoutines.value.filter(r => r.id !== routine.id);
    emit('deleted');
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case '饮食': return 'type-饮食';
    case '出游': return 'type-出游';
    case '洗护': return 'type-洗护';
    case '医疗': return 'type-医疗';
    default: return 'type-默认';
  }
};

</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="打卡历史记录"
    width="600px"
    :lock-scroll="false"
    class="history-dialog"
  >
    <div v-loading="loading" class="history-content">
      <!-- 标签搜索区 -->
      <div class="tags-container" v-if="historyRoutines.length > 0">
        <span class="tags-label">标签搜索：</span>
        <div class="tags-list">
          <el-tag
            v-for="tag in availableTags"
            :key="tag"
            :type="selectedTag === tag ? 'primary' : 'info'"
            :effect="selectedTag === tag ? 'dark' : 'plain'"
            class="filter-tag"
            round
            @click="selectedTag = tag"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <!-- 列表区 -->
      <div class="list-container">
        <el-empty v-if="historyRoutines.length === 0" description="暂无历史打卡记录" :image-size="100"></el-empty>
        <el-empty v-else-if="filteredRoutines.length === 0" description="未找到符合该标签的记录" :image-size="100"></el-empty>
        
        <div v-else class="history-list">
          <div v-for="routine in filteredRoutines" :key="`${routine.pet_id}_${routine.id}`" class="history-item">
            <div class="item-main">
              <div class="item-header">
                <span class="item-title">{{ routine.title }}</span>
                <span class="item-pet">{{ routine.petName }}</span>
              </div>
              <div class="item-meta">
                <span class="item-type" :class="getTypeColor(routine.task_type)">{{ routine.task_type }}</span>
                <span class="item-time">
                  <el-icon><Clock /></el-icon> {{ routine.task_time }}
                </span>
                <span class="item-date">
                  结束于: {{ routine.end_date || (routine.frequency_type === 'once' ? routine.frequency_value : '未知') }}
                </span>
              </div>
            </div>
            <div class="item-actions">
              <el-button type="danger" :icon="Delete" circle plain @click="handleDelete(routine)"></el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.history-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 20px;
}

.tags-container {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 10px;
}

.tags-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  line-height: 28px;
  font-weight: bold;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  cursor: pointer;
  transition: all 0.2s;
  padding: 0 12px;
  border-radius: 14px;
}

.filter-tag:hover {
  opacity: 0.8;
}

.list-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.list-container::-webkit-scrollbar {
  width: 6px;
}

.list-container::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fdfbf7;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  transition: border-color 0.2s;
}

.history-item:hover {
  border-color: #ddd;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.item-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.item-pet {
  font-size: 12px;
  color: var(--primary-yellow);
  background: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(252, 211, 113, 0.5);
  font-weight: bold;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.item-type {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.type-饮食 { background: #fee2e2; color: #ef4444; }
.type-出游 { background: #dcfce7; color: #22c55e; }
.type-洗护 { background: #e0f2fe; color: #0ea5e9; }
.type-医疗 { background: #f3e8ff; color: #a855f7; }
.type-默认 { background: #eee; color: #666; }

.item-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-date {
  color: #999;
}

.item-actions {
  margin-left: 16px;
}
</style>
