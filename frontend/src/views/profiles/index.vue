<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PetCard from './PetCard.vue';
import PetFormDialog from './PetFormDialog.vue';
import { petApi, type Pet } from '../../services/api';

const pets = ref<Pet[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingPet = ref<Pet | null>(null);

const loadPets = async () => {
  loading.value = true;
  try {
    const res = await petApi.getPets();
    pets.value = res.data;
  } catch {
    ElMessage.error('加载宠物档案失败');
  } finally {
    loading.value = false;
  }
};

onMounted(loadPets);

const openAdd = () => { editingPet.value = null; dialogVisible.value = true; };
const openEdit = (pet: Pet) => { editingPet.value = pet; dialogVisible.value = true; };
const onDetail = (pet: Pet) => { ElMessage.info(`${pet.name} 详情页待开发`); };

const onDelete = async (pet: Pet) => {
  try {
    await ElMessageBox.confirm(`确认删除 ${pet.name}？`, '提示', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' });
    await petApi.deletePet(pet.id);
    pets.value = pets.value.filter(p => p.id !== pet.id);
    ElMessage.success('已删除');
  } catch {}
};
</script>

<template>
  <div class="profiles-container">
    <div class="header-actions">
      <el-button type="primary" :icon="Plus" class="add-btn" @click="openAdd">添加宠物</el-button>
    </div>
    <div v-if="loading" class="loading-placeholder">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="pets.length === 0" class="empty-state">
      <p>还没有宠物档案，快去添加你的第一只宠物吧！</p>
    </div>
    <el-row v-else :gutter="30">
      <el-col v-for="pet in pets" :key="pet.id" :xs="24" :sm="12" :md="8" :lg="6">
        <PetCard :pet="pet" @edit="openEdit" @detail="onDetail" @delete="onDelete" />
      </el-col>
    </el-row>
    <PetFormDialog v-model="dialogVisible" :pet="editingPet" @saved="loadPets" />
  </div>
</template>

<style scoped>
.profiles-container {
  padding-bottom: 40px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 30px;
}

.add-btn {
  background-color: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
  padding: 12px 24px;
  height: auto;
}

.loading-placeholder {
  padding: 24px;
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
}
</style>
