<template>
  <section class="profile-section">
    <div class="section-header compact-header">
      <div class="section-heading">
        <div class="section-icon-badge">
          <el-icon class="section-icon"><Lock /></el-icon>
        </div>
        <div class="section-heading-copy">
          <h2>修改密码</h2>
          <p>保护您的账号安全，定期更换密码是一个好习惯。</p>
        </div>
      </div>
    </div>
    <div class="section-card">
      <!-- 方式切换 Tab -->
      <div class="pwd-tabs">
        <button
          class="pwd-tab"
          :class="{ active: activeTab === 'old' }"
          @click="switchTab('old')"
        >原密码验证</button>
        <button
          class="pwd-tab"
          :class="{ active: activeTab === 'email' }"
          @click="switchTab('email')"
        >邮箱验证码</button>
      </div>

      <!-- 原密码方式 -->
      <el-form v-if="activeTab === 'old'" label-position="top" class="profile-form">
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

      <!-- 邮箱验证码方式 -->
      <el-form v-else label-position="top" class="profile-form">
        <el-form-item label="邮箱验证码">
          <div class="code-row">
            <el-input v-model="emailForm.code" placeholder="输入验证码" :prefix-icon="Message" maxlength="6" />
            <el-button
              class="send-code-btn"
              :disabled="countdown > 0"
              :loading="sendingCode"
              @click="sendCode"
            >{{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}</el-button>
          </div>
          <div class="code-tip">验证码将发送到你的注册邮箱</div>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="emailForm.new_password" type="password" placeholder="输入新密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="emailForm.confirm_password" type="password" placeholder="再次输入新密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-button type="primary" class="save-btn" :loading="savingPwd" @click="savePasswordByEmail">修改密码</el-button>
      </el-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Lock, Message } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/api/index';

const activeTab = ref<'old' | 'email'>('old');
const savingPwd = ref(false);
const sendingCode = ref(false);
const countdown = ref(0);

const pwdForm = reactive({ old_password: '', new_password: '', confirm_password: '' });
const emailForm = reactive({ code: '', new_password: '', confirm_password: '' });

const switchTab = (tab: 'old' | 'email') => {
  activeTab.value = tab;
};

// 原密码方式
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

// 发送邮箱验证码
const sendCode = async () => {
  sendingCode.value = true;
  try {
    await userApi.sendChangePwdCode();
    ElMessage.success('验证码已发送到你的注册邮箱');
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
  } catch {
    ElMessage.error('发送失败，请稍后重试');
  } finally {
    sendingCode.value = false;
  }
};

// 邮箱验证码方式
const savePasswordByEmail = async () => {
  if (!emailForm.code) { ElMessage.warning('请输入验证码'); return; }
  if (!emailForm.new_password) { ElMessage.warning('请输入新密码'); return; }
  if (emailForm.new_password !== emailForm.confirm_password) { ElMessage.warning('两次密码不一致'); return; }
  savingPwd.value = true;
  try {
    await userApi.changePasswordByEmail(emailForm.code, emailForm.new_password);
    ElMessage.success('密码修改成功');
    emailForm.code = emailForm.new_password = emailForm.confirm_password = '';
    countdown.value = 0;
  } catch {
    ElMessage.error('验证码错误或已过期');
  } finally {
    savingPwd.value = false;
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

/* Tab 切换 */
.pwd-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(0,0,0,0.06);
  padding-bottom: 0;
}
.pwd-tab {
  padding: 8px 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: rgba(58, 45, 26, 0.5);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}
.pwd-tab.active {
  color: var(--dark-charcoal);
  border-bottom-color: var(--primary-yellow);
}
.pwd-tab:hover:not(.active) {
  color: var(--dark-charcoal);
}

.profile-form { width: 100%; }

/* 验证码行 */
.code-row {
  display: flex;
  gap: 10px;
  width: 100%;
}
.code-row .el-input { flex: 1; }
.send-code-btn {
  white-space: nowrap;
  background: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 700;
}
.send-code-btn:hover:not(:disabled) {
  background: #e5b800;
  border-color: #e5b800;
}
.code-tip {
  font-size: 12px;
  color: rgba(58, 45, 26, 0.45);
  margin-top: 5px;
}

:deep(.el-input__wrapper) { transition: background-color 0.2s, box-shadow 0.2s; }
:deep(.el-input__wrapper.is-focus) {
  background-color: #fdfbf7 !important;
  box-shadow: 0 0 0 1px var(--primary-yellow) inset !important;
}
.save-btn {
  width: 100%;
  margin-top: 8px;
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
@media (max-width: 768px) {
  .section-card { padding: 20px 16px; }
}
</style>
