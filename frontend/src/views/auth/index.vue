<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Message, Lock, User, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { authApi } from '../../services/api';

const router = useRouter();
const isLogin = ref(true);
const countdown = ref(0);
const loginLoading = ref(false);
const registerLoading = ref(false);
const sendCodeLoading = ref(false);

const loginForm = reactive({ email: '', password: '' });
const registerForm = reactive({ username: '', email: '', code: '', password: '' });

const sendCode = async () => {
  if (!registerForm.email) { ElMessage.warning('请先输入邮箱'); return; }
  sendCodeLoading.value = true;
  try {
    const res = await authApi.sendCode(registerForm.email);
    if (res.code === 200) {
      ElMessage.success('验证码已发送到您的邮箱');
      countdown.value = 60;
      const timer = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(timer); }, 1000);
    } else { ElMessage.error(res.message || '发送失败'); }
  } catch { ElMessage.error('发送验证码失败，请检查网络'); }
  finally { sendCodeLoading.value = false; }
};

const handleLogin = async () => {
  if (!loginForm.email || !loginForm.password) { ElMessage.warning('请填写完整信息'); return; }
  loginLoading.value = true;
  try {
    const res = await authApi.login(loginForm.email, loginForm.password);
    if (res.code === 200 && res.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', String(res.data.id));
      localStorage.setItem('username', res.data.username);
      ElMessage.success('登录成功');
      router.push('/');
    } else { ElMessage.error(res.message || '登录失败'); }
  } catch { ElMessage.error('登录失败，请检查邮箱和密码'); }
  finally { loginLoading.value = false; }
};

const handleRegister = async () => {
  if (!registerForm.username || !registerForm.email || !registerForm.code || !registerForm.password) {
    ElMessage.warning('请填写完整信息'); return;
  }
  registerLoading.value = true;
  try {
    const res = await authApi.register(registerForm.username, registerForm.email, registerForm.code, registerForm.password);
    if (res.code === 200) { ElMessage.success('注册成功，请登录'); isLogin.value = true; }
    else { ElMessage.error(res.message || '注册失败'); }
  } catch { ElMessage.error('注册失败，请稍后再试'); }
  finally { registerLoading.value = false; }
};
</script>

<template>
  <div class="auth-container">
    <div class="bg-animations">
      <svg class="anim-shape paw-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.5c-1.5 0-2.7-1.2-2.7-2.7S10.5 3.1 12 3.1s2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7zM6.8 11.5C5.3 11.5 4 10.2 4 8.7s1.3-2.7 2.8-2.7 2.8 1.2 2.8 2.7-1.3 2.8-2.8 2.8zm10.4 0c-1.5 0-2.8-1.2-2.8-2.7s1.3-2.7 2.8-2.7 2.8 1.2 2.8 2.7-1.3 2.8-2.8 2.8zM12 21c-4.4 0-6.8-3.2-6.8-6.5 0-2.5 1.5-4.5 3.5-5.5.8-.4 1.8-.6 2.8-.6h1c1 0 2 .2 2.8.6 2 1 3.5 3 3.5 5.5C18.8 17.8 16.4 21 12 21z"/></svg>
      <svg class="anim-shape paw-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.5c-1.5 0-2.7-1.2-2.7-2.7S10.5 3.1 12 3.1s2.7 1.2 2.7 2.7-1.2 2.7-2.7 2.7zM6.8 11.5C5.3 11.5 4 10.2 4 8.7s1.3-2.7 2.8-2.7 2.8 1.2 2.8 2.7-1.3 2.8-2.8 2.8zm10.4 0c-1.5 0-2.8-1.2-2.8-2.7s1.3-2.7 2.8-2.7 2.8 1.2 2.8 2.7-1.3 2.8-2.8 2.8zM12 21c-4.4 0-6.8-3.2-6.8-6.5 0-2.5 1.5-4.5 3.5-5.5.8-.4 1.8-.6 2.8-.6h1c1 0 2 .2 2.8.6 2 1 3.5 3 3.5 5.5C18.8 17.8 16.4 21 12 21z"/></svg>
      <svg class="anim-shape bone-1" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 7c-.4 0-.8.1-1.1.3l-2.9-2.9c-.8-.8-2.1-.8-2.9 0L12 5.1 11.4 4.4c-.8-.8-2.1-.8-2.9 0l-2.9 2.9C5.4 7.1 5 7 4.5 7 3.1 7 2 8.1 2 9.5S3.1 12 4.5 12c.4 0 .8-.1 1.1-.3l2.9 2.9c.8.8 2.1.8 2.9 0L12 13.9l.6.6c.8.8 2.1.8 2.9 0l2.9-2.9c.2.2.6.3 1.1.3 1.4 0 2.5-1.1 2.5-2.5S20.9 7 19.5 7z"/></svg>
    </div>
    <div class="auth-box">
      <div class="auth-header">
        <div class="logo-icon">🐾</div>
        <h2>{{ isLogin ? '登录 PawCircle' : '注册 PawCircle' }}</h2>
        <p>{{ isLogin ? '欢迎回来，铲屎官！' : '加入我们，和毛孩子们一起玩耍！' }}</p>
      </div>
      <el-form v-if="isLogin" :model="loginForm" class="auth-form">
        <el-form-item><el-input v-model="loginForm.email" placeholder="邮箱" :prefix-icon="Message" size="large" /></el-form-item>
        <el-form-item><el-input v-model="loginForm.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password /></el-form-item>
        <el-button type="primary" class="submit-btn" size="large" :loading="loginLoading" @click="handleLogin">登录</el-button>
      </el-form>
      <el-form v-else :model="registerForm" class="auth-form">
        <el-form-item><el-input v-model="registerForm.username" placeholder="用户名" :prefix-icon="User" size="large" /></el-form-item>
        <el-form-item><el-input v-model="registerForm.email" placeholder="邮箱" :prefix-icon="Message" size="large" /></el-form-item>
        <el-form-item>
          <div class="verify-code-wrapper">
            <el-input v-model="registerForm.code" placeholder="邮箱验证码" :prefix-icon="Key" size="large" />
            <el-button class="send-code-btn" size="large" :disabled="countdown > 0 || sendCodeLoading" :loading="sendCodeLoading" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item><el-input v-model="registerForm.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password /></el-form-item>
        <el-button type="primary" class="submit-btn" size="large" :loading="registerLoading" @click="handleRegister">注册</el-button>
      </el-form>
      <div class="auth-footer">
        <span class="toggle-text" @click="isLogin = !isLogin">
          {{ isLogin ? '没有账号？立即注册' : '已有账号？立即登录' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background-color: var(--bg-color); padding: 20px;
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2000; overflow: hidden;
}
.bg-animations { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 0; pointer-events: none; }
.anim-shape { position: absolute; opacity: 0.1; color: var(--primary-yellow); }
.paw-1 { width: 120px; height: 120px; top: 10%; left: 10%; animation: float 8s ease-in-out infinite; }
.paw-2 { width: 80px; height: 80px; bottom: 15%; right: 15%; animation: float 6s ease-in-out infinite reverse; color: var(--pastel-green); }
.bone-1 { width: 100px; height: 100px; top: 20%; right: 10%; animation: rotateFloat 10s linear infinite; color: var(--pastel-blue); }
@keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(10deg)} }
@keyframes rotateFloat { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
.auth-box {
  position: relative; z-index: 1; background-color: var(--card-bg);
  padding: 40px; border-radius: var(--border-radius-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.04); width: 100%; max-width: 400px;
}
.auth-header { text-align: center; margin-bottom: 30px; }
.logo-icon { font-size: 48px; background-color: var(--primary-yellow); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto 16px; }
.auth-header h2 { margin: 0 0 8px; font-size: 24px; font-weight: 800; color: var(--dark-charcoal); }
.auth-header p { margin: 0; color: var(--text-secondary); font-size: 14px; }
.auth-form { margin-bottom: 20px; }
.verify-code-wrapper { display: flex; gap: 12px; width: 100%; }
.send-code-btn { white-space: nowrap; padding: 0 16px; }
.submit-btn { width: 100%; background-color: var(--primary-yellow); border-color: var(--primary-yellow); color: var(--dark-charcoal); font-weight: 800; margin-top: 10px; }
.submit-btn:hover { background-color: #e5b800; border-color: #e5b800; }
.auth-footer { text-align: center; }
.toggle-text { color: var(--text-secondary); font-size: 14px; cursor: pointer; transition: color 0.3s; }
.toggle-text:hover { color: var(--dark-charcoal); text-decoration: underline; }
:deep(.el-input__wrapper) { background-color: var(--bg-color); box-shadow: none !important; border: 1px solid #e0e0e0; }
:deep(.el-input__wrapper.is-focus) { border-color: var(--primary-yellow); }
</style>

