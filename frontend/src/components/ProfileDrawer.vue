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
                :src="form.avatar || defaultAvatar"
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
            <el-button type="primary" class="save-btn" @click="saveProfile">
              保存修改
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="我的评论" name="comments">
          <div class="my-comments-section">
            <div v-if="myCommentsLoading" class="comments-loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
            <div v-else-if="myComments.length === 0" class="comments-empty">
              <span>还没有发表过评论</span>
            </div>
            <div v-else class="comment-list">
              <div v-for="c in myComments" :key="c.id" class="comment-item">
                <div class="comment-moment-ref">💬 {{ c.moment_content?.slice(0, 30) }}{{ (c.moment_content?.length ?? 0) > 30 ? '...' : '' }}</div>
                <div class="comment-body">
                  <span class="comment-content">{{ c.content }}</span>
                  <el-button
                    class="delete-comment-btn"
                    type="danger"
                    link
                    size="small"
                    @click="deleteMyComment(c)"
                  >删除</el-button>
                </div>
                <div class="comment-time">{{ formatTime(c.created_at) }}</div>
              </div>
            </div>
          </div>
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
            <el-button type="primary" class="save-btn" @click="savePassword">
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
import { Lock, User, Camera, Loading } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { userApi, commentApi } from '@/api/index';
import type { Comment } from '@/api/comment';

// v-model:visible
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'avatar-change', url: string): void;
  (e: 'comment-deleted', momentId: number, commentId: number, hasUserCommented: boolean): void;
}>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { visible.value = v; });
watch(visible, v => { emit('update:modelValue', v); });

const activeTab = ref('info');
const saving = ref(false);
const avatarInputRef = ref<HTMLInputElement | null>(null);
const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%23FBBF24'/><text font-size='56' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='central'>🐾</text></svg>`;

const form = reactive({ username: '', avatar: '', bio: '' });
const pwdForm = reactive({ old_password: '', new_password: '', confirm_password: '' });

// 我的评论
const myComments = ref<(Comment & { moment_content?: string })[]>([]);
const myCommentsLoading = ref(false);

const loadMyComments = async () => {
  myCommentsLoading.value = true;
  try {
    const res = await commentApi.getMyComments();
    myComments.value = res.data.items;
  } catch {
    ElMessage.error('加载评论失败');
  } finally {
    myCommentsLoading.value = false;
  }
};

const deleteMyComment = async (c: Comment & { moment_id?: number }) => {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const res = await commentApi.deleteComment(c.moment_id!, c.id);
    myComments.value = myComments.value.filter(item => item.id !== c.id);
    const hasUserCommented = (res.data as any)?.has_user_commented ?? false;
    emit('comment-deleted', c.moment_id!, c.id, hasUserCommented);
    ElMessage.success('评论已删除');
  } catch {
    // 取消操作不处理
  }
};

const formatTime = (t: string) =>
  new Date(t).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// 切换 tab 时加载评论
watch(activeTab, (tab) => {
  if (tab === 'comments') loadMyComments();
});

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
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 200;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      form.avatar = canvas.toDataURL('image/jpeg', 0.7);
    };
    img.src = ev.target?.result as string;
  };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = '';
};

const saveProfile = async () => {
  saving.value = true;
  try {
    const res = await userApi.updateProfile({ username: form.username, avatar: form.avatar || null, bio: form.bio });
    form.username = res.data.username || '';
    form.avatar = res.data.avatar || '';
    form.bio = res.data.bio || '';
    localStorage.setItem('username', form.username);
    if (form.avatar) {
      localStorage.setItem('avatar', form.avatar);
    } else {
      localStorage.removeItem('avatar');
    }
    emit('avatar-change', form.avatar || defaultAvatar);
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
    visible.value = false;
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
  outline: 3px solid var(--primary-yellow);
  outline-offset: 0;
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

/* 我的评论 */
.my-comments-section { padding: 4px 0; }

.comments-loading,
.comments-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
}

.loading-icon {
  font-size: 24px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.comment-list { display: flex; flex-direction: column; gap: 10px; }

.comment-item {
  background: #fdfbf7;
  border: 1px solid #f0e8d0;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-moment-ref {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
  border-left: 3px solid var(--primary-yellow);
  padding-left: 6px;
  line-height: 1.4;
}

.comment-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.comment-content {
  font-size: 14px;
  font-weight: 700;
  color: var(--dark-charcoal);
  flex: 1;
  line-height: 1.5;
}

.delete-comment-btn {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  padding: 0;
}

.comment-time {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
}
</style>

