<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { petApi } from '@/api';
import type { Pet } from '@/api/pet';

const emit = defineEmits<{
  (e: 'select', pet: Pet): void;
  (e: 'close'): void;
}>();

const pets = ref<Pet[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await petApi.getPets();
    pets.value = Array.isArray(res) ? res : (res as any).data || [];
  } catch {
    ElMessage.error('获取宠物列表失败');
  } finally {
    loading.value = false;
  }
});

const select = (pet: Pet) => {
  emit('select', pet);
};
</script>

<template>
  <div class="pet-picker-mask" @click.self="emit('close')">
    <div class="pet-picker-panel">
      <div class="pet-picker-header">
        <span>选择宠物档案</span>
        <el-icon class="picker-close" @click="emit('close')"><Close /></el-icon>
      </div>
      <div v-loading="loading" class="pet-picker-body">
        <div v-if="!loading && pets.length === 0" class="picker-empty">还没有添加宠物档案</div>
        <div
          v-for="pet in pets"
          :key="pet.id"
          class="pet-picker-item"
          @click="select(pet)"
        >
          <el-avatar :size="48" :src="pet.image" shape="square" class="pet-thumb" />
          <div class="pet-info">
            <div class="pet-name">{{ pet.name }}</div>
            <div class="pet-sub">{{ pet.breed }} · {{ pet.gender }}</div>
          </div>
          <el-icon class="pick-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pet-picker-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.pet-picker-panel {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
}
@media (min-width: 768px) {
  .pet-picker-mask {
    align-items: center;
  }
  .pet-picker-panel {
    max-width: 600px;
    border-radius: 12px;
    max-height: 80vh;
  }
}
.pet-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--dark-charcoal);
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.picker-close {
  font-size: 18px;
  cursor: pointer;
  color: #aaa;
}
.picker-close:hover { color: #666; }
.pet-picker-body {
  overflow-y: auto;
  padding: 8px 0;
  flex: 1;
}
.picker-empty {
  text-align: center;
  color: #bbb;
  padding: 32px 0;
  font-size: 13px;
}
.pet-picker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  cursor: pointer;
  transition: background 0.15s;
}
.pet-picker-item:hover { background: #fafafa; }
.pet-thumb { border-radius: 8px; flex-shrink: 0; }
.pet-info { flex: 1; min-width: 0; }
.pet-name { font-size: 14px; font-weight: 700; color: var(--dark-charcoal); }
.pet-sub { font-size: 12px; color: #999; margin-top: 2px; }
.pick-arrow { color: #ccc; font-size: 14px; }
</style>
