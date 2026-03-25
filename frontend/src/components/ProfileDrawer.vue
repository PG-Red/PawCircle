<template>
  <el-drawer
    v-model="visible"
    title="个人资料"
    direction="rtl"
    size="420px"
    :with-header="true"
  >
    <div class="profile-drawer">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="info">
          <div class="avatar-section">
            <div class="avatar-upload-wrapper" @click="triggerAvatarUpload">
              <el-avatar
                :size="100"
                :src="form.avatar || 'https://picsum.photos/seed/user/100/100'"
                class="profile-avatar"
              />
              <div class="avatar-overlay">
                <el-icon class="camera-icon"><Camera /></el-icon>
              </div>
            </div>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleAvatarUpload"
            />
          </div>

          <el-form label-position="top" class="profile-form">
            <el-form-item label="用户名">
              <el-input v-model="form.username" placeholder="输入用户名" :prefix-icon="User" />
            </el-form-item>
            <el-form-item label="个人简介">
              <div class="bio-wrapper">
                <textarea
                  v-model="form.bio"
                  class="bio-textarea"
                  placeholder="介绍一下自己..."
                  :maxlength="200"
                ></textarea>
                <span class="bio-count" :class="{ 'near-limit': form.bio.length >= 180 }">
                  {{ form.bio.length }}/200
                </span>
              </div>
            </el-form-item>
            <el-button type="primary" class="save-btn" :loading="saving" @click="saveProfile">
              保存修改
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <el-form label-position="top" class="profile-form">
            <el-form-item label="原密码">
              <el-input v-model="pwdForm.old_password" type="password" placeholder="输入原密码" :prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="pwdForm.new_password" type="password" placeholder="输入新密码" :prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input v-model="pwdForm.confirm_password" type="password" placeholder="再次输入新密码" :prefix-icon="Lock" show-password />
            </el-form-item>
            <el-button type="primary" class="save-btn" :loading="saving" @click="savePassword">
              修改密码
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { Lock, User, Camera } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi } from '../services/api';

// v-model:visible
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'avatar-change', url: string): void;
}>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { visible.value = v; });
watch(visible, v => { emit('update:modelValue', v); });

const activeTab = ref('info');
const saving = ref(false);
const avatarInputRef = ref<HTMLInputElement | null>(null);

const form = reactive({ username: '', avatar: '', bio: '' });
const pwdForm = reactive({ old_password: '', new_password: '', confirm_password: '' });

// 打开时加载用户信息
watch(visible, async (v) => {
  if (!v) return;
  activeTab.value = 'info';
  try {
    const res = await userApi.getProfile();
    form.username = res.data.username || '';
    form.avatar   = res.data.avatar   || '';
    form.bio      = res.data.bio      || '';
  } catch {
    form.username = localStorage.getItem('username') || '';
  }
});

const triggerAvatarUpload = () => avatarInputRef.value?.click();

const handleAvatarUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { ElMessage.warning('请选择图片文件'); return; }
  if (file.size > 2 * 1024 * 1024)    { ElMessage.warning('图片大小不能超过 2MB'); return; }
  const reader = new FileReader();
  reader.onload = ev => { form.avatar = ev.target?.result as string; };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = '';
};

const saveProfile = async () => {
  saving.value = true;
  try {
    await userApi.updateProfile({ username: form.username, avatar: form.avatar, bio: form.bio });
    localStorage.setItem('username', form.username);
    emit('avatar-change', form.avatar);
    ElMessage.success('资料保存成功');
    visible.value = false;
  } catch {
    ElMessage.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
};

const savePassword = async () => {
  if (!pwdForm.old_password || !pwdForm.new_password) { ElMessage.warning('请填写完整信息'); return; }
  if (pwdForm.new_password !== pwdForm.confirm_password) { ElMessage.warning('两次密码不一致'); return; }
  saving.value = true;
  try {
    await userApi.changePassword(pwdForm.old_password, pwdForm.new_password);
    ElMessage.success('密码修改成功');
    pwdForm.old_password = pwdForm.new_password = pwdForm.confirm_password = '';
  } catch {
    ElMessage.error('原密码错误或修改失败');
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.profile-drawer { padding: 8px 4px; }

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding: 20px;
  border-radius: var(--border-radius-lg);
}

.avatar-upload-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  overflow: hidden;
  border: 3px solid var(--primary-yellow);
  box-sizing: border-box;
}

.avatar-upload-wrapper:hover .avatar-overlay { opacity: 1; }

.profile-avatar {
  width: 100px !important;
  height: 100px !important;
  display: block;
  border: none;
}

:deep(.profile-avatar img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.camera-icon { font-size: 24px; color: #fff; }

.profile-form { padding: 0 4px; }

.bio-wrapper { position: relative; width: 100%; }

.bio-textarea {
  width: 100%;
  height: 90px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--dark-charcoal);
  background-color: transparent;
  resize: none;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s, background-color 0.2s;
  line-height: 1.6;
}

.bio-textarea::placeholder { color: var(--text-secondary); font-weight: 500; }
.bio-textarea:focus { border-color: var(--primary-yellow); background-color: #fdfbf7; }

.bio-count {
  position: absolute;
  bottom: 8px;
  right: 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  pointer-events: none;
}
.bio-count.near-limit { color: #FA8C16; }

/* el-input focus 背景 */
:deep(.el-input__wrapper) {
  transition: background-color 0.2s, box-shadow 0.2s;
}
:deep(.el-input__wrapper.is-focus) {
  background-color: #fdfbf7 !important;
  box-shadow: 0 0 0 1px var(--primary-yellow) inset !important;
}

.save-btn {
  width: 100%;
  margin-top: 8px;
  background-color: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
  height: 44px;
}
.save-btn:hover {
  background-color: #e5b800;
  border-color: #e5b800;
  color: var(--dark-charcoal);
}
</style>

