<script setup lang="ts">
import { ref } from 'vue';
import { Location, Clock, ArrowDown, ArrowUp } from '@element-plus/icons-vue';

interface Listing {
  id: number;
  category: string;
  title: string;
  description: string;
  price: number;
  location: string;
  date: string;
  image: string;
}

const props = defineProps<{ listing: Listing }>();
const emit = defineEmits<{ (e: 'contact', id: number): void }>();
const expanded = ref(false);
</script>

<template>
  <div class="trade-card">
    <div class="image-wrapper">
      <transition name="fade" mode="out-in">
        <div v-if="expanded" class="details-view" @click.stop>
          <h4 class="details-title">宠物详情</h4>
          <p class="desc-overlay">{{ listing.description }}</p>
        </div>
        <div v-else class="image-content">
          <el-image :src="listing.image" class="trade-image" fit="cover" referrerPolicy="no-referrer" />
          <div class="price-tag">¥{{ listing.price }}</div>
        </div>
      </transition>
    </div>
    <div class="trade-info">
      <h3 class="title">{{ listing.title }}</h3>
      <div class="details-btn" @click.stop="expanded = !expanded">
        <span>{{ expanded ? '收起详情' : '查看详情' }}</span>
        <el-icon><ArrowUp v-if="expanded" /><ArrowDown v-else /></el-icon>
      </div>
      <div class="meta">
        <div class="meta-item"><el-icon><Location /></el-icon><span>{{ listing.location }}</span></div>
        <div class="meta-item"><el-icon><Clock /></el-icon><span>{{ listing.date }}</span></div>
      </div>
      <button class="contact-btn" @click="emit('contact', listing.id)">联系卖家</button>
    </div>
  </div>
</template>

<style scoped>
.trade-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.trade-card:hover {
  transform: translateY(-5px);
}

.image-wrapper {
  position: relative;
  padding: 16px 16px 0;
  height: 236px;
}

.image-content,
.details-view {
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
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.details-title {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--dark-charcoal);
  font-weight: 800;
}

.desc-overlay {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
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
  margin: 0 0 8px;
  color: var(--dark-charcoal);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.details-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
  font-weight: 700;
  margin-bottom: 12px;
  transition: background 0.2s;
}

.details-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
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
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.contact-btn:hover {
  opacity: 0.9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
