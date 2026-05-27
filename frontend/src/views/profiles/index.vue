<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import PetCard from './components/PetCard.vue';
import PetFormDialog from './components/PetFormDialog.vue';
import PetDetailDialog from '@/components/PetDetailDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { petApi, type Pet } from '@/api/index';

const pets = ref<Pet[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingPet = ref<Pet | null>(null);
const deleteDialogVisible = ref(false);
const pendingDeletePet = ref<Pet | null>(null);
const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const detailPet = ref<Pet | null>(null);

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
const onDetail = async (pet: Pet) => {
  detailDialogVisible.value = true;
  detailPet.value = pet; // 优先复用已有信息，如果请求失败也能显示
};

const onDelete = (pet: Pet) => {
  pendingDeletePet.value = pet;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  const pet = pendingDeletePet.value;
  if (!pet) return;
  try {
    await petApi.deletePet(pet.id);
    pets.value = pets.value.filter(p => p.id !== pet.id);
    ElMessage.success('已删除');
  } catch {
    ElMessage.error('删除失败，请重试');
  } finally {
    pendingDeletePet.value = null;
  }
};
</script>

<template>
  <div class="profiles-container">
    <ConfirmDialog
      v-model="deleteDialogVisible"
      :title="`确认删除 ${pendingDeletePet?.name}？`"
      description="删除后将无法恢复，确定要删除这个宠物档案吗？"
      ok-text="删除"
      default-icon="🐾"
      @confirm="confirmDelete"
    />
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

    <PetDetailDialog
      v-model="detailDialogVisible"
      :pet-id="detailPet?.id || null"
      :initial-data="detailPet"
    />
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

:deep(.el-dialog) {
  border-radius: var(--border-radius-lg);
}

:deep(.el-dialog__title) {
  font-weight: 900;
}

</style>
