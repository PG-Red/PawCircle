<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import PetCard from './components/PetCard.vue';
import PetFormDialog from './components/PetFormDialog.vue';
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
  detailLoading.value = true;
  try {
    const res = await petApi.getPet(pet.id);
    detailPet.value = res.data;
  } catch {
    detailPet.value = pet;
    ElMessage.error('加载详情失败，已显示当前信息');
  } finally {
    detailLoading.value = false;
  }
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

const calcAge = (birthday: string) => {
  if (!birthday) return '未知';
  const years = new Date().getFullYear() - new Date(birthday).getFullYear();
  return years > 0 ? `${years}岁` : '不足1岁';
};

const formatBirthday = (birthday: string) => {
  if (!birthday) return '-';
  return birthday.slice(0, 10);
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

    <el-dialog v-model="detailDialogVisible" title="宠物详情" width="520px" align-center>
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="detailPet">
          <el-image :src="detailPet.image" class="detail-image" fit="cover" referrerPolicy="no-referrer" />
          <h3 class="detail-name">{{ detailPet.name }}</h3>
          <div class="detail-list">
            <div class="detail-row">
              <span class="detail-label">品种</span>
              <span class="detail-value">{{ detailPet.breed }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">性别</span>
              <span class="detail-value">{{ detailPet.gender }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">年龄</span>
              <span class="detail-value">{{ calcAge(detailPet.birthday) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">生日</span>
              <span class="detail-value">{{ formatBirthday(detailPet.birthday) }}</span>
            </div>
          </div>
          <div class="detail-desc">
            <div class="detail-desc-title">宠物描述</div>
            <p>{{ detailPet.description || '这个小家伙还没有留下介绍～' }}</p>
          </div>
        </template>
      </div>
    </el-dialog>
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

.detail-content {
  min-height: 240px;
}

.detail-image {
  width: 100%;
  height: 220px;
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
}

.detail-name {
  margin: 0 0 14px;
  font-size: 24px;
  font-weight: 900;
  color: var(--dark-charcoal);
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 2px dashed #f0f0f0;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 700;
}

.detail-value {
  color: var(--dark-charcoal);
  font-size: 14px;
  font-weight: 800;
}

.detail-desc {
  background: var(--bg-color);
  border-radius: var(--border-radius-md);
  padding: 14px;
}

.detail-desc-title {
  font-weight: 800;
  color: var(--dark-charcoal);
  margin-bottom: 8px;
}

.detail-desc p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 14px;
}

:deep(.el-dialog) {
  border-radius: var(--border-radius-lg);
}

:deep(.el-dialog__title) {
  font-weight: 900;
}

</style>
