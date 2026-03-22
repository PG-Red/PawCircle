<template>
  <div class="profiles-container">
    <div class="header-actions">
      <el-button type="primary" :icon="Plus" class="add-btn">添加宠物</el-button>
    </div>

    <el-row :gutter="30">
      <el-col v-for="pet in pets" :key="pet.id" :xs="24" :sm="12" :md="8" :lg="6">
        <div class="pet-card">
          <div class="image-wrapper">
            <el-image 
              :src="pet.image" 
              class="pet-image" 
              fit="cover"
              referrerPolicy="no-referrer"
            />
            <div class="gender-badge" :class="pet.gender === '弟弟' ? 'blue' : 'orange'">
              {{ pet.gender }}
            </div>
          </div>
          <div class="pet-info">
            <h3 class="name">{{ pet.name }}</h3>
            <div class="pet-details">
              <div class="detail-item">
                <span class="label">品种</span>
                <span class="value">{{ pet.breed }}</span>
              </div>
              <div class="detail-item">
                <span class="label">年龄</span>
                <span class="value">{{ pet.age }}</span>
              </div>
            </div>
            <div class="pet-actions">
              <el-button class="action-btn edit-btn">编辑</el-button>
              <el-button class="action-btn detail-btn">详情</el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';

const pets = ref([
  {
    id: 1,
    name: 'Max',
    breed: '萨摩耶',
    age: '2岁',
    gender: '弟弟',
    birthday: '2022-05-12',
    image: 'https://picsum.photos/seed/samoyed/400/300'
  },
  {
    id: 2,
    name: 'Luna',
    breed: '英国短毛猫',
    age: '1岁',
    gender: '妹妹',
    birthday: '2023-02-20',
    image: 'https://picsum.photos/seed/cat3/400/300'
  },
  {
    id: 3,
    name: 'Charlie',
    breed: '柯基',
    age: '3岁',
    gender: '弟弟',
    birthday: '2021-11-05',
    image: 'https://picsum.photos/seed/corgi2/400/300'
  }
]);
</script>

<style scoped>
.profiles-container {
  padding-bottom: 40px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--dark-charcoal);
  margin: 0;
  letter-spacing: -0.5px;
}

.add-btn {
  background-color: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
  padding: 12px 24px;
  height: auto;
}

.pet-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.pet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.image-wrapper {
  position: relative;
  padding: 16px 16px 0 16px;
}

.pet-image {
  width: 100%;
  height: 220px;
  border-radius: var(--border-radius-md);
}

.gender-badge {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 6px 16px;
  border-radius: var(--border-radius-pill);
  font-weight: 800;
  font-size: 14px;
  color: var(--dark-charcoal);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.gender-badge.blue { background-color: var(--pastel-blue); }
.gender-badge.orange { background-color: var(--pastel-orange); }

.pet-info {
  padding: 20px 24px 24px;
}

.name {
  font-size: 24px;
  font-weight: 800;
  color: var(--dark-charcoal);
  margin: 0 0 16px 0;
}

.pet-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px dashed #F0F0F0;
}

.label {
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 15px;
}

.value {
  color: var(--dark-charcoal);
  font-weight: 800;
  font-size: 15px;
}

.pet-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  height: 44px;
  font-size: 16px;
  border-radius: var(--border-radius-pill);
  font-weight: 700;
  cursor: pointer;
}

.edit-btn {
  background-color: #F5F5F5;
  border: none;
  color: var(--dark-charcoal);
}

.detail-btn {
  background-color: var(--dark-charcoal);
  border: none;
  color: #fff;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }
  .add-btn {
    padding: 8px 16px;
    font-size: 14px;
  }
  .pet-info {
    padding: 16px;
  }
  .name {
    font-size: 20px;
  }
}
</style>
