<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Search, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ListingCard from './ListingCard.vue';
import { listingApi, type PetListing } from '../../services/api';

const activeCategory = ref('all');
const searchQuery = ref('');
const items = ref<PetListing[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);

const loadListings = async () => {
  loading.value = true;
  try {
    const res = await listingApi.getListings(page.value, 12, activeCategory.value, searchQuery.value);
    items.value = res.data.items;
    total.value = res.data.total;
  } catch {
    ElMessage.error('加载交易列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(loadListings);

let searchTimer: ReturnType<typeof setTimeout>;
watch([activeCategory, searchQuery], () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { page.value = 1; loadListings(); }, 400);
});

const onContact = (id: number) => {
  const item = items.value.find(i => i.id === id);
  if (item?.seller?.email) {
    ElMessage.info(`联系卖家：${item.seller.email}`);
  } else {
    ElMessage.info('联系卖家功能待开发');
  }
};
</script>

<template>
  <div class="trading-container">
    <div class="filter-bar">
      <div class="category-pills">
        <div
          v-for="[val, label] in [['all','全部'],['dog','狗狗'],['cat','猫咪'],['other','其他']]"
          :key="val"
          class="pill"
          :class="{ active: activeCategory === val }"
          @click="activeCategory = val"
        >
          {{ label }}
        </div>
      </div>
      <div class="search-wrapper">
        <el-icon class="search-icon"><Search /></el-icon>
        <input v-model="searchQuery" type="text" placeholder="搜索宠物..." class="custom-search" />
      </div>
    </div>
    <div v-if="loading" class="loading-placeholder">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="items.length === 0" class="empty-state">暂无相关交易信息</div>
    <el-row v-else :gutter="30">
      <el-col v-for="item in items" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
        <ListingCard :listing="item" @contact="onContact" />
      </el-col>
    </el-row>
    <el-pagination
      v-if="total > 12"
      v-model:current-page="page"
      :page-size="12"
      :total="total"
      layout="prev, pager, next"
      class="pagination"
      @current-change="loadListings"
    />
  </div>
</template>

<style scoped>
.trading-container {
  padding-bottom: 40px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  gap: 20px;
  flex-wrap: wrap;
}

.category-pills {
  display: flex;
  gap: 12px;
}

.pill {
  padding: 12px 24px;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-pill);
  font-weight: 800;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.pill.active {
  background-color: var(--dark-charcoal);
  color: #fff;
}

.search-wrapper {
  position: relative;
  width: 300px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 18px;
}

.custom-search {
  width: 100%;
  padding: 14px 16px 14px 44px;
  border-radius: var(--border-radius-pill);
  border: none;
  background-color: var(--card-bg);
  font-family: inherit;
  font-size: 16px;
  color: var(--dark-charcoal);
  outline: none;
  box-sizing: border-box;
}

.custom-search::placeholder {
  color: var(--text-secondary);
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

.pagination {
  margin-top: 32px;
  justify-content: center;
  display: flex;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .category-pills {
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .pill {
    white-space: nowrap;
    padding: 8px 16px;
    font-size: 14px;
  }

  .search-wrapper {
    width: 100%;
  }
}
</style>
