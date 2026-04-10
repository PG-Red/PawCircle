<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ListingCard from './ListingCard.vue';
import { listingApi, type PetListing } from '@/api/index';

const activeCategory = ref('all');
const searchQuery = ref('');
const items = ref<PetListing[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);

const contactDialogVisible = ref(false);
const contacting = ref(false);
const contactSeller = ref({
  username: '',
  email: '',
  listingTitle: '',
});

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

const onContact = async (id: number) => {
  contacting.value = true;
  try {
    const res = await listingApi.getListing(id);
    const detail = res.data;
    contactSeller.value = {
      username: detail.seller?.username || '卖家',
      email: detail.seller?.email || '',
      listingTitle: detail.title || '',
    };
    contactDialogVisible.value = true;
  } catch {
    ElMessage.error('获取卖家联系方式失败');
  } finally {
    contacting.value = false;
  }
};

const copySellerEmail = async () => {
  if (!contactSeller.value.email) {
    ElMessage.warning('卖家暂未提供邮箱');
    return;
  }
  try {
    await navigator.clipboard.writeText(contactSeller.value.email);
    ElMessage.success('邮箱已复制');
  } catch {
    ElMessage.error('复制失败，请手动复制');
  }
};

const sendEmailToSeller = () => {
  if (!contactSeller.value.email) {
    ElMessage.warning('卖家暂未提供邮箱');
    return;
  }
  const subject = encodeURIComponent(`咨询：${contactSeller.value.listingTitle}`);
  window.open(`mailto:${contactSeller.value.email}?subject=${subject}`, '_self');
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

    <el-dialog v-model="contactDialogVisible" title="联系卖家" width="440px" align-center>
      <div v-loading="contacting" class="contact-dialog-body">
        <div class="seller-row">
          <span class="label">卖家</span>
          <span class="value">{{ contactSeller.username }}</span>
        </div>
        <div class="seller-row">
          <span class="label">商品</span>
          <span class="value">{{ contactSeller.listingTitle }}</span>
        </div>
        <div class="seller-row">
          <span class="label">邮箱</span>
          <span class="value">{{ contactSeller.email || '未提供' }}</span>
        </div>
      </div>
      <template #footer>
        <div class="contact-footer">
          <el-button class="copy-btn" @click="copySellerEmail">复制邮箱</el-button>
          <el-button type="primary" class="email-btn" @click="sendEmailToSeller">发送邮件</el-button>
        </div>
      </template>
    </el-dialog>

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

.contact-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

.seller-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg-color);
}

.seller-row .label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.seller-row .value {
  color: var(--dark-charcoal);
  font-size: 14px;
  font-weight: 800;
  text-align: right;
  word-break: break-all;
}

.contact-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.copy-btn {
  min-width: 96px;
  border-radius: var(--border-radius-pill);
  font-weight: 700;
}

.email-btn {
  min-width: 112px;
  border-radius: var(--border-radius-pill);
  background-color: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
}

.email-btn:hover {
  background-color: #e5b800;
  border-color: #e5b800;
  color: var(--dark-charcoal);
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
