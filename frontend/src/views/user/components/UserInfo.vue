<template>
  <section class="profile-section">
    <div class="section-header compact-header">
      <div class="section-heading">
        <div class="section-icon-badge">
      <el-icon class="section-icon"><User /></el-icon>
        </div>
        <div class="section-heading-copy">
      <h2>基本信息</h2>
          <p>调整资料展示方式，决定别人能看到多少关于你和毛孩子的内容。</p>
        </div>
      </div>
    </div>
    <div class="section-card">
      <el-form label-position="top" class="profile-form">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="输入用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="个人简介">
          <div class="bio-wrapper">
            <textarea v-model="form.bio" class="bio-textarea" placeholder="介绍一下自己..." :maxlength="200"></textarea>
            <span class="bio-count" :class="{ 'near-limit': form.bio.length >= 180 }">{{ form.bio.length }}/200</span>
          </div>
        </el-form-item>

        <el-form-item label="公开设置">
          <div class="privacy-panel">
            <div class="privacy-intro">
              <span class="privacy-kicker">PROFILE VISIBILITY</span>
              <h3>谁能看见你的宠物档案</h3>
              <p>你可以单独控制“是否公开宠物”以及“公开时是否展示详细信息”，让资料呈现更灵活。</p>
            </div>

            <button
              type="button"
              class="privacy-option"
              :class="{ active: form.show_pets_public }"
              @click="form.show_pets_public = !form.show_pets_public"
            >
              <div class="privacy-copy">
                <div class="privacy-title-row">
                  <span class="privacy-badge">01</span>
                  <h4>公开宠物</h4>
                </div>
                <p>开启后，其他人可以在你的公开主页中看到你拥有的宠物。</p>
              </div>
            <el-switch
              v-model="form.show_pets_public"
                class="privacy-switch"
                @click.stop
              />
            </button>

            <button
              type="button"
              class="privacy-option detail-option"
              :class="{ active: form.show_pets_public && form.show_pet_details_public, disabled: !form.show_pets_public }"
              @click="form.show_pets_public && (form.show_pet_details_public = !form.show_pet_details_public)"
            >
              <div class="privacy-copy">
                <div class="privacy-title-row">
                  <span class="privacy-badge">02</span>
                  <h4>公开宠物详情</h4>
                </div>
                <p>
                  开启后，会展示品种、生日、描述等更完整的信息；关闭时仅显示宠物名称和基础卡片。
                </p>
              </div>
            <el-switch
              v-model="form.show_pet_details_public"
                class="privacy-switch"
              :disabled="!form.show_pets_public"
                @click.stop
            />
            </button>
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
  username: '',
  avatar: '',
  bio: '',
  show_pets_public: true,
  show_pet_details_public: true,
});
const savingProfile = ref(false);

onMounted(async () => {
  try {
    const res = await userApi.getProfile();
    form.username = res.data.username || '';
    form.avatar = res.data.avatar || '';
    form.bio = res.data.bio || '';
    form.show_pets_public = !!res.data.show_pets_public;
    form.show_pet_details_public = !!res.data.show_pet_details_public;
  } catch {
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
      show_pets_public: form.show_pets_public,
      show_pet_details_public: form.show_pet_details_public,
    });
    form.username = res.data.username || '';
    form.avatar = res.data.avatar || '';
    form.bio = res.data.bio || '';
    form.show_pets_public = !!res.data.show_pets_public;
    form.show_pet_details_public = !!res.data.show_pet_details_public;
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

.privacy-panel {
  display: grid;
  gap: 14px;
}

.privacy-intro {
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(255, 244, 217, 0.72) 100%);
  border: 1px solid rgba(251, 191, 36, 0.18);
}

.privacy-kicker {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 0.12em;
  font-weight: 800;
  color: #b7791f;
  margin-bottom: 8px;
}

.privacy-intro h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 900;
  color: var(--dark-charcoal);
}

.privacy-intro p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(58, 45, 26, 0.72);
}

.privacy-option {
  width: 100%;
  border: 1px solid rgba(224, 210, 180, 0.9);
  border-radius: 18px;
  background: rgba(255,255,255,0.82);
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.privacy-option:hover {
  transform: translateY(-1px);
  border-color: rgba(251, 191, 36, 0.45);
  box-shadow: 0 12px 24px rgba(242, 180, 27, 0.08);
}

.privacy-option.active {
  border-color: rgba(251, 191, 36, 0.65);
  box-shadow: 0 14px 28px rgba(242, 180, 27, 0.12);
}

.privacy-option.disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.privacy-copy {
  flex: 1;
}

.privacy-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.privacy-badge {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(251, 191, 36, 0.18);
  color: #8a5a11;
  font-size: 12px;
  font-weight: 900;
}

.privacy-copy h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: var(--dark-charcoal);
}

.privacy-copy p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.privacy-switch {
  align-self: center;
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

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #f2b41b;
  border-color: #f2b41b;
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

  .privacy-option {
    padding: 16px;
    align-items: flex-start;
  }
}
</style>

