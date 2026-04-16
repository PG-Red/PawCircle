<script setup lang="ts">
import { defineAsyncComponent, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { listingApi, socialApi, type PetListing } from '../../api/index';

const ListingCard = defineAsyncComponent(() => import('./components/ListingCard.vue'));

const router = useRouter();
const activeCategory = ref('all');
const searchQuery = ref('');
const items = ref<PetListing[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);

const sellerDialogVisible = ref(false);
const contacting = ref(false);
const selectedListing = ref<PetListing | null>(null);
const currentUserId = Number(localStorage.getItem('userId') || 0);

const loadListings = async () => {
  loading.value = true;
  try {
    const res = await listingApi.getListings(page.value, 12, activeCategory.value, searchQuery.value);
    items.value = res.items;
    total.value = res.total;
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

const onContact = async (listing: PetListing) => {
  contacting.value = true;
  try {
    const res = await listingApi.getListing(listing.id);
    selectedListing.value = res;
    sellerDialogVisible.value = true;
  } catch {
    ElMessage.error('获取卖家信息失败');
  } finally {
    contacting.value = false;
  }
};

const goToChatWithSeller = async () => {
  const listing = selectedListing.value;
  if (!listing) return;

  if (Number(listing.seller.id) === currentUserId) {
    ElMessage.warning('这是你自己发布的交易');
    return;
  }

  try {
    const friendsRes = await socialApi.getFriends();
    const isFriend = (friendsRes.data || []).some(friend => Number(friend.id) === Number(listing.seller.id));

    if (!isFriend) {
      ElMessage.warning('请先在对方主页添加好友，再进行私聊');
      return;
    }

    sellerDialogVisible.value = false;
    router.push({
      path: '/chat',
      query: { friendId: String(listing.seller.id) },
    });
  } catch {
    ElMessage.error('打开私聊失败');
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

    <el-dialog v-model="sellerDialogVisible" title="卖家信息" width="460px" align-center>
      <div v-loading="contacting" class="contact-dialog-body">
        <div v-if="selectedListing" class="seller-card">
          <el-avatar :size="56" :src="selectedListing.seller.avatar" />
          <div class="seller-main">
            <div class="seller-id">卖家 ID</div>
            <div class="seller-name">{{ selectedListing.seller.username }}</div>
          </div>
        </div>
        <div v-if="selectedListing" class="seller-row intro-row">
          <span class="label">卖家介绍</span>
          <span class="value intro-text">{{ selectedListing.seller_intro || selectedListing.description || '暂无介绍' }}</span>
        </div>
      </div>
      <template #footer>
        <div class="contact-footer">
          <el-button type="primary" class="email-btn" @click="goToChatWithSeller">去私聊联系</el-button>
        </div>
      </template>
    </el-dialog>

    <el-pagination
      v-if="total > 12"
      :current-page="page"
      :page-size="12"
      :total="total"
      layout="prev, pager, next"
      class="pagination"
      @current-change="(value) => { page = value; loadListings(); }"
    />
  </div>
</template>

<style scoped>
:deep(.el-dialog__title) {
  font-weight: 800;
}

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

.seller-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  background: var(--bg-color);
}

.seller-main {
  min-width: 0;
}

.seller-id {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}

.seller-name {
  color: var(--dark-charcoal);
  font-size: 18px;
  font-weight: 900;
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

.intro-row {
  align-items: flex-start;
  flex-direction: column;
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
}

.intro-text {
  width: 100%;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.contact-footer {
  display: flex;
  justify-content: flex-end;
}

.email-btn {
  min-width: 132px;
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
