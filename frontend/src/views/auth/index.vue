<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Message, Lock, User, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { authApi, userApi } from '../../api/index';
import { RequestError } from '../../utils/request';

const router = useRouter();
const isLogin = ref(true);
const loginMode = ref<'password' | 'code'>('password');
const registerCountdown = ref(0);
const loginCountdown = ref(0);
const loginLoading = ref(false);
const registerLoading = ref(false);
const sendCodeLoading = ref(false);
const sendLoginCodeLoading = ref(false);
const captchaLoading = ref(false);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginForm = reactive({ email: '', password: '', code: '', captchaCode: '' });
const registerForm = reactive({ username: '', email: '', code: '', password: '' });
const captcha = reactive({ id: '', svg: '' });

const loginButtonText = computed(() =>
  loginMode.value === 'password' ? '密码登录' : '验证码登录'
);

const isValidEmail = (email: string) => EMAIL_REGEX.test(email.trim());

const ensureEmail = (email: string) => {
  if (!email.trim()) {
    ElMessage.warning('请先输入邮箱');
    return false;
  }
  if (!isValidEmail(email)) {
    ElMessage.warning('请输入正确的邮箱格式');
    return false;
  }
  return true;
};

const normalizeCode = (value: string) => value.replace(/\D/g, '').slice(0, 6);
const normalizeCaptchaCode = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();

const startCountdown = (target: typeof registerCountdown | typeof loginCountdown) => {
  target.value = 60;
  const timer = setInterval(() => {
    target.value -= 1;
    if (target.value <= 0) clearInterval(timer);
  }, 1000);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof RequestError) {
    return typeof error.message === 'string' && error.message ? error.message : fallback;
  }
  if (error instanceof Error) {
    return typeof error.message === 'string' && error.message ? error.message : fallback;
  }
  return fallback;
};

const loadCaptcha = async () => {
  captchaLoading.value = true;
  try {
    const res = await authApi.getCaptcha();
    if (res.code === 200 && res.data) {
      captcha.id = res.data.captchaId;
      captcha.svg = res.data.captchaSvg;
      if (!loginForm.captchaCode) return;
      loginForm.captchaCode = normalizeCaptchaCode(loginForm.captchaCode);
      return;
    }
    ElMessage.error(res.message || '获取图形验证码失败');
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '获取图形验证码失败'));
  } finally {
    captchaLoading.value = false;
  }
};

const sendCode = async () => {
  if (!ensureEmail(registerForm.email)) return;
  sendCodeLoading.value = true;
  try {
    const res = await authApi.sendCode(registerForm.email.trim());
    if (res.code === 200) {
      ElMessage.success('验证码已发送到您的邮箱');
      startCountdown(registerCountdown);
    } else {
      ElMessage.error(res.message || '发送失败');
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '发送验证码失败，请检查网络'));
  } finally {
    sendCodeLoading.value = false;
  }
};

const sendLoginCode = async () => {
  if (!ensureEmail(loginForm.email)) return;
  sendLoginCodeLoading.value = true;
  try {
    const res = await authApi.sendLoginCode(loginForm.email.trim());
    if (res.code === 200) {
      ElMessage.success('登录验证码已发送到您的邮箱');
      startCountdown(loginCountdown);
    } else {
      ElMessage.error(res.message || '发送失败');
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '发送登录验证码失败，请检查网络'));
  } finally {
    sendLoginCodeLoading.value = false;
  }
};

const syncProfileAfterLogin = async () => {
  try {
    const profile = await userApi.getProfile();
    if (profile.data?.user_code) localStorage.setItem('user_code', profile.data.user_code);
    if (profile.data?.avatar) localStorage.setItem('avatar', profile.data.avatar);
    else localStorage.removeItem('avatar');
  } catch {}
};

const saveLoginSession = async (data: { token: string; id: number; user_code?: string; username: string }) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('userId', String(data.id));
  if (data.user_code) localStorage.setItem('user_code', data.user_code);
  localStorage.setItem('username', data.username);
  await syncProfileAfterLogin();
  ElMessage.success('登录成功');
  router.push('/');
};

const handleLogin = async () => {
  if (loginLoading.value) return;
  if (!ensureEmail(loginForm.email)) return;
  if (!captcha.id) {
    await loadCaptcha();
    return;
  }
  if (normalizeCaptchaCode(loginForm.captchaCode).length !== 4) {
    ElMessage.warning('请输入 4 位图形验证码');
    return;
  }
  if (loginMode.value === 'password' && !loginForm.password) {
    ElMessage.warning('请输入密码');
    return;
  }
  if (loginMode.value === 'code' && normalizeCode(loginForm.code).length !== 6) {
    ElMessage.warning('请输入 6 位数字验证码');
    return;
  }

  loginLoading.value = true;
  try {
    const res = await authApi.login(
      loginForm.email.trim(),
      loginMode.value === 'password' ? loginForm.password : undefined,
      loginMode.value === 'code' ? loginForm.code.trim() : undefined,
      captcha.id,
      normalizeCaptchaCode(loginForm.captchaCode)
    );

    if (res.code === 200 && res.data?.token) {
      await saveLoginSession(res.data);
    } else {
      ElMessage.error(res.message || '登录失败');
      await loadCaptcha();
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error, loginMode.value === 'password' ? '登录失败，请检查邮箱和密码' : '验证码登录失败，请检查邮箱和验证码'));
    await loadCaptcha();
  } finally {
    loginLoading.value = false;
  }
};

const handleRegister = async () => {
  if (!registerForm.username.trim()) {
    ElMessage.warning('请输入用户名');
    return;
  }
  if (!ensureEmail(registerForm.email)) return;
  if (normalizeCode(registerForm.code).length !== 6) {
    ElMessage.warning('请输入 6 位数字验证码');
    return;
  }
  if (!registerForm.password) {
    ElMessage.warning('请输入密码');
    return;
  }

  registerLoading.value = true;
  try {
    const res = await authApi.register(
      registerForm.username.trim(),
      registerForm.email.trim(),
      registerForm.code.trim(),
      registerForm.password
    );
    if (res.code === 200) {
      ElMessage.success('注册成功，请登录');
      isLogin.value = true;
      loginMode.value = 'password';
      loginForm.email = registerForm.email.trim();
      loginForm.password = '';
      loginForm.code = '';
    } else {
      ElMessage.error(res.message || '注册失败');
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '注册失败，请稍后再试'));
  } finally {
    registerLoading.value = false;
  }
};

const switchAuthMode = () => {
  isLogin.value = !isLogin.value;
  loginMode.value = 'password';
  loginForm.password = '';
  loginForm.code = '';
  loginForm.captchaCode = '';
  if (isLogin.value) {
    loadCaptcha();
  }
};

const handleLoginCodeInput = (value: string) => {
  loginForm.code = normalizeCode(value);
};

const handleCaptchaCodeInput = (value: string) => {
  loginForm.captchaCode = normalizeCaptchaCode(value);
};

const handleRegisterCodeInput = (value: string) => {
  registerForm.code = normalizeCode(value);
};

onMounted(() => {
  loadCaptcha();
});
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

      <el-form v-if="isLogin" :model="loginForm" class="auth-form" @submit.prevent="handleLogin">
        <div class="login-mode-tabs">
          <button type="button" class="mode-pill" :class="{ active: loginMode === 'password' }" @click="loginMode = 'password'">密码登录</button>
          <button type="button" class="mode-pill" :class="{ active: loginMode === 'code' }" @click="loginMode = 'code'">验证码登录</button>
        </div>
        <el-form-item>
          <el-input v-model="loginForm.email" placeholder="邮箱" :prefix-icon="Message" size="large" @keydown.enter.prevent="loginMode === 'password' ? handleLogin() : sendLoginCode()" />
        </el-form-item>
        <el-form-item v-if="loginMode === 'password'">
          <el-input v-model="loginForm.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item v-else>
          <div class="verify-code-wrapper">
            <el-input v-model="loginForm.code" maxlength="6" inputmode="numeric" placeholder="登录验证码" :prefix-icon="Key" size="large" @input="handleLoginCodeInput" />
            <el-button class="send-code-btn" size="large" :disabled="loginCountdown > 0 || sendLoginCodeLoading" :loading="sendLoginCodeLoading" @click="sendLoginCode">
              {{ loginCountdown > 0 ? `${loginCountdown}s 后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <div class="captcha-wrapper">
            <el-input v-model="loginForm.captchaCode" maxlength="4" placeholder="图形验证码" :prefix-icon="Key" size="large" @input="handleCaptchaCodeInput" />
            <button type="button" class="captcha-card" :disabled="captchaLoading" @click="loadCaptcha">
              <span v-if="captchaLoading" class="captcha-placeholder">加载中...</span>
              <span v-else-if="captcha.svg" class="captcha-image" v-html="captcha.svg"></span>
              <span v-else class="captcha-placeholder">点击刷新</span>
            </button>
          </div>
        </el-form-item>
        <el-button type="primary" native-type="submit" class="submit-btn" size="large" :loading="loginLoading">{{ loginButtonText }}</el-button>
      </el-form>

      <el-form v-else :model="registerForm" class="auth-form" @submit.prevent="handleRegister">
        <el-form-item><el-input v-model="registerForm.username" placeholder="用户名" :prefix-icon="User" size="large" /></el-form-item>
        <el-form-item><el-input v-model="registerForm.email" placeholder="邮箱" :prefix-icon="Message" size="large" @keydown.enter.prevent="sendCode" /></el-form-item>
        <el-form-item>
          <div class="verify-code-wrapper">
            <el-input v-model="registerForm.code" maxlength="6" inputmode="numeric" placeholder="邮箱验证码" :prefix-icon="Key" size="large" @input="handleRegisterCodeInput" />
            <el-button class="send-code-btn" size="large" :disabled="registerCountdown > 0 || sendCodeLoading" :loading="sendCodeLoading" @click="sendCode">
              {{ registerCountdown > 0 ? `${registerCountdown}s 后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item><el-input v-model="registerForm.password" type="password" placeholder="密码" :prefix-icon="Lock" size="large" show-password /></el-form-item>
        <el-button type="primary" native-type="submit" class="submit-btn" size="large" :loading="registerLoading">注册</el-button>
      </el-form>

      <div class="auth-footer">
        <span class="toggle-text" @click="switchAuthMode">
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
  box-shadow: 0 8px 24px rgba(0,0,0,0.04); width: 100%; max-width: 420px;
}
.auth-header { text-align: center; margin-bottom: 30px; }
.logo-icon { font-size: 48px; background-color: var(--primary-yellow); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto 16px; }
.auth-header h2 { margin: 0 0 8px; font-size: 24px; font-weight: 800; color: var(--dark-charcoal); }
.auth-header p { margin: 0; color: var(--text-secondary); font-size: 14px; }
.auth-form { margin-bottom: 20px; }
.login-mode-tabs { display: flex; gap: 10px; margin-bottom: 16px; }
.mode-pill {
  flex: 1; border: none; border-radius: 999px; padding: 11px 16px; cursor: pointer;
  background: #f3efe3; color: var(--text-secondary); font-weight: 800; transition: all 0.25s ease;
}
.mode-pill.active { background: var(--dark-charcoal); color: #fff; box-shadow: 0 8px 18px rgba(0,0,0,0.12); }
.verify-code-wrapper { display: flex; gap: 12px; width: 100%; }
.captcha-wrapper { display: flex; gap: 12px; width: 100%; align-items: stretch; }
.captcha-card {
  min-width: 132px; height: 40px; border: 1px dashed #d8c56c; border-radius: 14px;
  background: linear-gradient(135deg, #fff7db 0%, #fff1b8 100%); cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 0 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.captcha-card:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(201, 155, 0, 0.12); border-color: #c99b00; }
.captcha-card:disabled { cursor: wait; opacity: 0.75; }
.captcha-image { display: flex; align-items: center; justify-content: center; width: 100%; }
.captcha-image :deep(svg) { display: block; width: 100%; height: 100%; }
.captcha-placeholder { color: #8f6a00; font-size: 13px; font-weight: 700; white-space: nowrap; }
.send-code-btn { white-space: nowrap; padding: 0 16px; }
.submit-btn { width: 100%; background-color: var(--primary-yellow); border-color: var(--primary-yellow); color: var(--dark-charcoal); font-weight: 800; margin-top: 10px; }
.submit-btn:hover { background-color: #e5b800; border-color: #e5b800; }
.auth-footer { text-align: center; }
.toggle-text { color: var(--text-secondary); font-size: 14px; cursor: pointer; transition: color 0.3s; }
.toggle-text:hover { color: var(--dark-charcoal); text-decoration: underline; }
:deep(.el-input__wrapper) { background-color: var(--bg-color); box-shadow: none !important; border: 1px solid #e0e0e0; }
:deep(.el-input__wrapper.is-focus) { border-color: var(--primary-yellow); }
</style>
