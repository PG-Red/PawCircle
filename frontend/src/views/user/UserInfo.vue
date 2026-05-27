<template>
  <section class="profile-section">
    <div class="section-header compact-header">
      <div class="section-heading">
        <div class="section-icon-badge">
      <el-icon class="section-icon"><User /></el-icon>
        </div>
        <div class="section-heading-copy">
      <h2>基本信息</h2>
          <p>完善您的基本资料，让更多毛孩子家长认识你。</p>
        </div>
      </div>
    </div>
    <div class="section-card">
      <el-form label-position="top" class="profile-form">
        <el-form-item label="用户编号">
          <el-input :model-value="form.user_code" readonly placeholder="系统自动生成的 8 位编号" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="输入用户名" :prefix-icon="User" />
        </el-form-item>

        <el-form-item label="个人简介">
          <div class="bio-wrapper">
            <textarea v-model="form.bio" class="bio-textarea" placeholder="介绍一下自己..." :maxlength="200"></textarea>
            <span class="bio-count" :class="{ 'near-limit': form.bio.length >= 180 }">{{ form.bio.length }}/200</span>
          </div>
        </el-form-item>

        <el-button type="primary" class="save-btn" :loading="savingProfile" @click="saveProfile">
          <span class="save-btn-text">保存修改</span>
        </el-button>
      </el-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/api/index';
import { eventBus } from '@/utils/eventBus';

const form = reactive({
  user_code: '',
  username: '',
  avatar: '',
  bio: '',
});
const savingProfile = ref(false);

onMounted(async () => {
  try {
    const res = await userApi.getProfile();
    form.user_code = res.data.user_code || '';
    form.username = res.data.username || '';
    form.avatar = res.data.avatar || '';
    form.bio = res.data.bio || '';
  } catch {
    form.user_code = localStorage.getItem('user_code') || '';
    form.username = localStorage.getItem('username') || '';
  }
});

const saveProfile = async () => {
  savingProfile.value = true;
  try {
    const res = await userApi.updateProfile({
      username: form.username,
      avatar: form.avatar || null,
      bio: form.bio,
    });
    form.user_code = res.data.user_code || form.user_code;
    form.username = res.data.username || '';
    form.avatar = res.data.avatar || '';
    form.bio = res.data.bio || '';
    localStorage.setItem('user_code', form.user_code);
    localStorage.setItem('username', form.username);

    if (form.avatar) {
      localStorage.setItem('avatar', form.avatar);
      eventBus.emit('avatar-changed', form.avatar);
    } else {
      localStorage.removeItem('avatar');
      eventBus.emit('avatar-changed', '');
    }
    ElMessage.success('资料保存成功');
  } catch {
    ElMessage.error('保存失败，请重试');
  } finally {
    savingProfile.value = false;
  }
};
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.compact-header {
  background: transparent;
}

.section-heading {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.section-heading-copy {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.section-heading-copy h2 {
  font-size: 18px;
  font-weight: 900;
  color: var(--dark-charcoal);
  margin: 0;
  letter-spacing: -0.3px;
}

.section-heading-copy p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.section-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffe59a 0%, #ffc940 100%);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.24);
  flex-shrink: 0;
}

.section-icon {
  font-size: 15px;
  color: #3b2f17;
}

.section-card {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,248,235,0.96) 100%);
  border-radius: 24px;
  padding: 28px 32px;
  box-shadow: 0 16px 40px rgba(34, 24, 10, 0.08);
  border: 1px solid rgba(243, 199, 95, 0.22);
}

.profile-form {
  width: 100%;
}

.bio-wrapper {
  position: relative;
  width: 100%;
}

.bio-textarea {
  width: 100%;
  height: 96px;
  padding: 12px 14px;
  border: 1px solid rgba(224, 210, 180, 0.9);
  border-radius: 14px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--dark-charcoal);
  background: rgba(255,255,255,0.75);
  resize: none;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
  line-height: 1.65;
}

.bio-textarea::placeholder {
  color: var(--text-secondary);
  font-weight: 500;
}

.bio-textarea:focus {
  border-color: #f2b41b;
  background-color: #fffdfa;
  box-shadow: 0 0 0 4px rgba(242, 180, 27, 0.12);
}

.bio-count {
  position: absolute;
  bottom: 10px;
  right: 12px;
  font-size: 12px;
  font-weight: 800;
  color: var(--text-secondary);
  pointer-events: none;
}

.bio-count.near-limit {
  color: #fa8c16;
}

.save-btn {
  margin-top: 8px;
  min-width: 136px;
  height: 46px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #3b2f17;
  font-weight: 900;
  box-shadow: 0 14px 28px rgba(245, 158, 11, 0.22);
}

.save-btn:hover {
  background: linear-gradient(135deg, #f6b10f 0%, #e18b07 100%);
  color: #2f2412;
}

.save-btn-text {
  letter-spacing: 0.02em;
}

:deep(.el-form-item__label) {
  font-weight: 800;
  color: var(--dark-charcoal);
}

:deep(.el-input__wrapper) {
  border-radius: 14px;
  background: rgba(255,255,255,0.82);
  box-shadow: 0 0 0 1px rgba(224, 210, 180, 0.9) inset;
  transition: box-shadow 0.2s, background-color 0.2s;
}

:deep(.el-input__wrapper.is-focus) {
  background-color: #fffdfa;
  box-shadow: 0 0 0 2px rgba(242, 180, 27, 0.4) inset !important;
}

@media (max-width: 768px) {
  .section-card {
    padding: 20px 18px;
    border-radius: 20px;
  }

  .section-heading-copy {
    gap: 6px;
  }

  .section-heading-copy p {
    width: 100%;
  }
}
</style>

