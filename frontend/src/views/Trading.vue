<template>
  <div class="trading-container">
    <div class="filter-bar">
      <div class="category-pills">
        <div 
          class="pill" 
          :class="{ active: activeCategory === 'all' }"
          @click="activeCategory = 'all'"
        >全部</div>
        <div 
          class="pill" 
          :class="{ active: activeCategory === 'dog' }"
          @click="activeCategory = 'dog'"
        >狗狗</div>
        <div 
          class="pill" 
          :class="{ active: activeCategory === 'cat' }"
          @click="activeCategory = 'cat'"
        >猫咪</div>
        <div 
          class="pill" 
          :class="{ active: activeCategory === 'other' }"
          @click="activeCategory = 'other'"
        >其他</div>
      </div>
      
      <div class="search-wrapper">
        <el-icon class="search-icon"><Search /></el-icon>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索宠物..." 
          class="custom-search"
        />
      </div>
    </div>

    <el-row :gutter="30" class="trade-row">
      <el-col v-for="item in filteredItems" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" class="trade-col">
        <div class="trade-card">
          <div class="image-wrapper">
            <transition name="fade" mode="out-in">
              <div v-if="expandedItems[item.id]" class="details-view" @click.stop>
                <h4 class="details-title">宠物详情</h4>
                <p class="desc-overlay">{{ item.description }}</p>
              </div>
              <div v-else class="image-content">
                <el-image 
                  :src="item.image" 
                  class="trade-image" 
                  fit="cover"
                  referrerPolicy="no-referrer"
                />
                <div class="price-tag">${{ item.price }}</div>
              </div>
            </transition>
          </div>
          <div class="trade-info">
            <el-tooltip :content="item.title" placement="top" :show-after="300">
              <h3 class="title">{{ item.title }}</h3>
            </el-tooltip>
            
            <div class="details-container">
              <div class="details-btn" @click="(e) => toggleDetails(item.id, e)">
                <span>{{ expandedItems[item.id] ? '收起详情' : '查看详情' }}</span>
                <el-icon>
                  <ArrowUp v-if="expandedItems[item.id]" />
                  <ArrowDown v-else />
                </el-icon>
              </div>
            </div>

            <div class="meta">
              <div class="meta-item">
                <el-icon><Location /></el-icon>
                <span>{{ item.location }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>{{ item.date }}</span>
              </div>
            </div>
            <button class="contact-btn">联系卖家</button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Search, Location, Clock, ArrowDown, ArrowUp } from '@element-plus/icons-vue';

const activeCategory = ref('all');
const searchQuery = ref('');
const expandedItems = ref<Record<number, boolean>>({});

const toggleDetails = (id: number, event: Event) => {
  event.stopPropagation();
  const isExpanded = expandedItems.value[id];
  expandedItems.value = {};
  if (!isExpanded) {
    expandedItems.value[id] = true;
  }
};

const closeAllDetails = () => {
  expandedItems.value = {};
};

onMounted(() => {
  document.addEventListener('click', closeAllDetails);
});

onUnmounted(() => {
  document.removeEventListener('click', closeAllDetails);
});

const items = ref([
  {
    id: 1,
    category: 'dog',
    title: '金毛幼犬',
    description: '纯种，非常活泼健康，已接种疫苗。',
    price: 800,
    location: '纽约',
    date: '1天前',
    image: 'https://picsum.photos/seed/golden/400/300'
  },
  {
    id: 2,
    category: 'cat',
    title: '英国短毛猫',
    description: '性格温顺，会用猫砂盆。',
    price: 650,
    location: '洛杉矶',
    date: '2天前',
    image: 'https://picsum.photos/seed/cat4/400/300'
  },
  {
    id: 3,
    category: 'dog',
    title: '边境牧羊犬',
    description: '聪明活跃，需要有院子的家庭。',
    price: 900,
    location: '芝加哥',
    date: '3天前',
    image: 'https://picsum.photos/seed/border/400/300'
  }
]);

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchCategory = activeCategory.value === 'all' || item.category === activeCategory.value;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchCategory && matchSearch;
  });
});
</script>

<style scoped>
.trading-container {
  padding-bottom: 40px;
}

.header-section {
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--dark-charcoal);
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 600;
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
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
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
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--dark-charcoal);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  outline: none;
}

.custom-search::placeholder {
  color: var(--text-secondary);
}

.trade-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.trade-col {
  display: flex;
  flex-direction: column;
}

.trade-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.trade-card:hover {
  transform: translateY(-5px);
}

.image-wrapper {
  position: relative;
  padding: 16px 16px 0 16px;
  height: 236px;
}

.image-content, .details-view {
  width: 100%;
  height: 220px;
  border-radius: var(--border-radius-md);
  position: relative;
}

.details-view {
  background-color: #f8f9fa;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  border: 1px solid rgba(0,0,0,0.05);
}

.details-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--dark-charcoal);
  font-weight: 800;
}

.desc-overlay {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-weight: 600;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.trade-image {
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius-md);
}

.price-tag {
  position: absolute;
  bottom: 16px;
  right: 24px;
  background-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  padding: 8px 16px;
  border-radius: var(--border-radius-pill);
  font-weight: 900;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.trade-info {
  padding: 20px 24px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: var(--dark-charcoal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  min-height: 51px;
}

.details-container {
  margin-bottom: 16px;
}

.details-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  background-color: rgba(0,0,0,0.03);
  border-radius: 4px;
  transition: background-color 0.2s;
  font-weight: 700;
}

.details-btn:hover {
  background-color: rgba(0,0,0,0.06);
}



.meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  font-weight: 700;
  margin-top: auto;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-btn {
  width: 100%;
  padding: 14px;
  border-radius: var(--border-radius-pill);
  background-color: var(--dark-charcoal);
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 800;
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  transition: opacity 0.2s;
}

.contact-btn:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .category-pills {
    overflow-x: auto;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
  }
  .category-pills::-webkit-scrollbar {
    display: none;
  }
  .pill {
    white-space: nowrap;
    padding: 8px 16px;
    font-size: 14px;
  }
  .search-wrapper {
    width: 100%;
  }
  .trade-info {
    padding: 16px;
  }
  .title {
    font-size: 16px;
  }
}
</style>
