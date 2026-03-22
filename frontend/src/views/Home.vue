<template>
  <div class="home-container">
    <el-row :gutter="30">
      <!-- 左侧朋友圈列表 -->
      <el-col :xs="24" :sm="24" :md="16">
        <div class="moments-list">
          <div v-for="moment in moments" :key="moment.id" class="moment-card">
            <div class="moment-header">
              <el-avatar :size="48" :src="moment.avatar" class="moment-avatar" />
              <div class="user-meta">
                <span class="nickname">{{ moment.nickname }}</span>
                <span class="time">{{ moment.time }}</span>
              </div>
              <el-button circle class="more-btn"><el-icon><MoreFilled /></el-icon></el-button>
            </div>
            <div class="moment-content">
              <p>{{ moment.content }}</p>
              <div v-if="moment.image" class="image-wrapper">
                <el-image 
                  :src="moment.image" 
                  class="moment-image"
                  fit="cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div class="moment-footer">
              <div class="action-btn">
                <div class="icon-wrapper yellow"><el-icon><Star /></el-icon></div>
                <span>点赞</span>
              </div>
              <div class="action-btn">
                <div class="icon-wrapper green"><el-icon><ChatRound /></el-icon></div>
                <span>评论</span>
              </div>
              <div class="action-btn">
                <div class="icon-wrapper purple"><el-icon><Share /></el-icon></div>
                <span>分享</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧侧边栏 -->
      <el-col :xs="24" :sm="24" :md="8">
        <div class="featured-card dark">
          <h3>每日宠物语录</h3>
          <p>"狗是地球上唯一爱你胜过爱自己的生物。"</p>
          <div class="quote-author">- Josh Billings</div>
        </div>

        <div class="sidebar-section">
          <div class="section-header">
            <h3>为你推荐</h3>
            <span class="see-all">查看全部</span>
          </div>
          
          <div class="feature-item yellow-bg">
            <div class="feature-info">
              <h4>探索新活动</h4>
              <div class="tags">
                <span class="tag">10分钟</span>
                <span class="tag">傍晚</span>
              </div>
            </div>
            <div class="play-btn"><el-icon><VideoPlay /></el-icon></div>
          </div>

          <div class="feature-item white-bg">
            <div class="feature-info">
              <h4>深度睡眠冥想</h4>
              <div class="tags">
                <span class="tag">12分钟</span>
                <span class="tag">睡眠</span>
              </div>
            </div>
            <div class="play-btn yellow-text"><el-icon><VideoPlay /></el-icon></div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChatRound, Star, Share, MoreFilled, VideoPlay } from '@element-plus/icons-vue';

const moments = ref([
  {
    id: 1,
    nickname: '金毛爱好者',
    avatar: 'https://picsum.photos/seed/dog1/100/100',
    time: '2小时前',
    content: '公园里美好的一天！Max 很喜欢这阳光。🐶☀️',
    image: 'https://picsum.photos/seed/park/600/400'
  },
  {
    id: 2,
    nickname: '布偶猫舍',
    avatar: 'https://picsum.photos/seed/cat1/100/100',
    time: '4小时前',
    content: '新来的布偶小猫，眼里有星星 ✨',
    image: 'https://picsum.photos/seed/cat2/600/400'
  }
]);
</script>

<style scoped>
.home-container {
  padding-bottom: 40px;
}

.welcome-section {
  margin-bottom: 30px;
}

.greeting {
  font-size: 36px;
  font-weight: 800;
  color: var(--dark-charcoal);
  margin: 0 0 8px 0;
  letter-spacing: -1px;
}

.subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 600;
}

.moment-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.moment-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.moment-avatar {
  border: 2px solid var(--primary-yellow);
}

.user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 18px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.time {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 600;
}

.more-btn {
  border: none;
  background: #F5F5F5;
  color: var(--dark-charcoal);
}

.moment-content p {
  font-size: 16px;
  line-height: 1.6;
  color: var(--dark-charcoal);
  margin: 0 0 16px 0;
  font-weight: 600;
}

.image-wrapper {
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.moment-image {
  width: 100%;
  display: block;
}

.moment-footer {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px dashed #F0F0F0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 700;
  color: var(--dark-charcoal);
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.8;
}

.icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.icon-wrapper.yellow { background-color: var(--primary-yellow); }
.icon-wrapper.green { background-color: var(--pastel-green); }
.icon-wrapper.purple { background-color: var(--pastel-purple); }

.featured-card {
  border-radius: var(--border-radius-lg);
  padding: 30px;
  margin-bottom: 30px;
}

.featured-card.dark {
  background-color: var(--dark-charcoal);
  color: #fff;
}

.featured-card h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 800;
}

.featured-card p {
  font-size: 18px;
  line-height: 1.5;
  margin: 0 0 16px 0;
  font-weight: 600;
  color: var(--primary-yellow);
}

.quote-author {
  font-size: 14px;
  opacity: 0.7;
  font-weight: 700;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.see-all {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.feature-item.yellow-bg {
  background-color: var(--primary-yellow);
}

.feature-item.white-bg {
  background-color: var(--card-bg);
}

.feature-info h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--border-radius-pill);
  background-color: rgba(255,255,255,0.5);
  color: var(--dark-charcoal);
}

.white-bg .tag {
  background-color: #F5F5F5;
}

.play-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--dark-charcoal);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
}

.play-btn.yellow-text {
  background-color: var(--primary-yellow);
  color: var(--dark-charcoal);
}

@media (max-width: 768px) {
  .greeting {
    font-size: 28px;
  }
  .moment-card {
    padding: 16px;
  }
  .moment-footer {
    flex-wrap: wrap;
    gap: 16px;
  }
  .action-btn {
    font-size: 14px;
  }
  .icon-wrapper {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
  .featured-card {
    padding: 20px;
  }
}
</style>
