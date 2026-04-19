<template>
  <section class="profile-section">
    <div class="section-header compact-header">
      <div class="section-heading">
        <div class="section-icon-badge">
          <el-icon class="section-icon"><Setting /></el-icon>
        </div>
        <div class="section-heading-copy">
          <h2>设置</h2>
          <p>管理您的账户偏好与隐私设置。</p>
        </div>
      </div>
    </div>
    <div class="section-card">
      <el-form label-position="top" class="profile-form">
        <el-form-item label="公开设置">
          <PrivacySection
            kicker="PROFILE VISIBILITY"
            title="谁能看见你的宠物档案"
            description="你可以单独控制“是否公开宠物”以及“公开时是否展示详细信息”，让资料呈现更灵活。"
          >
            <PrivacyOption
              badge="01"
              title="公开宠物"
              description="开启后，其他人可以在你的公开主页中看到你拥有的宠物。"
              v-model="form.show_pets_public"
            />
            
            <PrivacyOption
              badge="02"
              title="公开宠物详情"
              description="开启后，会展示品种、生日、描述等更完整的信息；关闭时仅显示宠物名称和基础卡片。"
              v-model="form.show_pet_details_public"
              :disabled="!form.show_pets_public"
            />
          </PrivacySection>
        </el-form-item>

        <el-form-item label="私聊设置">
          <PrivacySection
            kicker="CHAT SETTINGS"
            title="谁可以给你发私信"
            description="你可以控制哪些人有权向你发起私信，保护自己不受陌生信息打扰。"
          >
            <PrivacyOption
              type="radio"
              badge="01"
              title="所有人"
              description="任何用户均可向你发送私信，包括陌生人（临时会话限制仍然生效）。"
              v-model="form.chat_permission"
              value="all"
            />

            <PrivacyOption
              type="radio"
              badge="02"
              title="仅好友"
              description="只有互为好友的用户才能向你发送私信，陌生人将被拒绝。"
              v-model="form.chat_permission"
              value="friends_only"
            />

            <PrivacyOption
              type="radio"
              badge="03"
              title="关闭私信"
              description="关闭后，任何人（包括好友）都无法向你发送新私信。"
              v-model="form.chat_permission"
              value="none"
            />
          </PrivacySection>
        </el-form-item>

        <el-form-item label="好友设置">
          <PrivacySection
            kicker="FRIEND SETTINGS"
            title="谁可以添加你为好友"
            description="关闭后，任何人都无法向你发送好友申请，你也不会收到新的申请通知。"
          >
            <PrivacyOption
              badge="01"
              title="允许好友申请"
              description="开启后，其他用户可以向你发送好友申请；关闭后申请入口将对所有人屏蔽。"
              v-model="form.allow_friend_request"
            />
          </PrivacySection>
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
import { Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/api/index';
import PrivacySection from './components/PrivacySection.vue';
import PrivacyOption from './components/PrivacyOption.vue';

const form = reactive({
  show_pets_public: true,
  show_pet_details_public: true,
  allow_friend_request: true,
  chat_permission: 'all' as 'all' | 'friends_only' | 'none',
});
const savingProfile = ref(false);

onMounted(async () => {
  try {
    const res = await userApi.getProfile();
    form.show_pets_public = !!res.data.show_pets_public;
    form.show_pet_details_public = !!res.data.show_pet_details_public;
    form.allow_friend_request = !!res.data.allow_friend_request;
    form.chat_permission = res.data.chat_permission || 'all';
  } catch {
    // ignore
  }
});

const saveProfile = async () => {
  savingProfile.value = true;
  try {
    const res = await userApi.updateProfile({
      show_pets_public: form.show_pets_public,
      show_pet_details_public: form.show_pet_details_public,
      allow_friend_request: form.allow_friend_request,
      chat_permission: form.chat_permission,
    });
    form.show_pets_public = !!res.data.show_pets_public;
    form.show_pet_details_public = !!res.data.show_pet_details_public;
    form.allow_friend_request = !!res.data.allow_friend_request;
    form.chat_permission = res.data.chat_permission || 'all';
    ElMessage.success('设置保存成功');
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
}
</style>
