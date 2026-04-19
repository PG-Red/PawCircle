<template>
  <section class="profile-section">
    <div class="section-header">
      <el-icon class="section-icon"><Lock /></el-icon>
      <h2>修改密码</h2>
    </div>
    <div class="section-card">
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
        <el-button type="primary" class="save-btn" :loading="savingPwd" @click="savePassword">修改密码</el-button>
      </el-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/api/index';

const pwdForm = reactive({ old_password: '', new_password: '', confirm_password: '' });
const savingPwd = ref(false);

const savePassword = async () => {
  if (!pwdForm.old_password || !pwdForm.new_password) { ElMessage.warning('请填写完整信息'); return; }
  if (pwdForm.new_password !== pwdForm.confirm_password) { ElMessage.warning('两次密码不一致'); return; }
  savingPwd.value = true;
  try {
    await userApi.changePassword(pwdForm.old_password, pwdForm.new_password);
    ElMessage.success('密码修改成功');
    pwdForm.old_password = pwdForm.new_password = pwdForm.confirm_password = '';
  } catch {
    ElMessage.error('原密码错误或修改失败');
  } finally {
    savingPwd.value = false;
  }
};
</script>

<style scoped>
.section-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px;
}
.section-header h2 {
  font-size: 18px; font-weight: 900;
  color: var(--dark-charcoal); margin: 0; letter-spacing: -0.3px;
}
.section-icon {
  font-size: 18px; padding: 7px;
  border-radius: 8px;
  background: var(--primary-yellow);
  color: var(--dark-charcoal);
}
.section-card {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 28px 32px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.profile-form { width: 100%; }
:deep(.el-input__wrapper) { transition: background-color 0.2s, box-shadow 0.2s; }
:deep(.el-input__wrapper.is-focus) {
  background-color: #fdfbf7 !important;
  box-shadow: 0 0 0 1px var(--primary-yellow) inset !important;
}
.save-btn {
  width: 100%; margin-top: 8px;
  background-color: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800; height: 44px;
}
.save-btn:hover { background-color: #e5b800; border-color: #e5b800; color: var(--dark-charcoal); }
@media (max-width: 768px) {
  .section-card { padding: 20px 16px; }
}
</style>

