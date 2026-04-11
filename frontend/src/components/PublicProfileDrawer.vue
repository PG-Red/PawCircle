<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { userApi, socialApi, type PublicUserProfile, type PublicPetDetail } from '@/api';

const props = defineProps<{
  modelValue: boolean;
  userId: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

const router = useRouter();

const state = reactive({
  loading: false,
  sending: false,
  profile: null as PublicUserProfile | null,
});

const profile = computed<PublicUserProfile | null>(() => state.profile);

const calcAge = (birthday: string) => {
  if (!birthday) return '未知';
  const birth = new Date(birthday);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) years--;
  return years > 0 ? `${years}岁` : '不足1岁';
};

const loadProfile = async () => {
  if (!props.userId) return;
  state.loading = true;
  try {
    const res = await userApi.getPublicProfile(props.userId);
    state.profile = res.data;
  } catch {
    ElMessage.error('加载用户资料失败');
    state.profile = null;
  } finally {
    state.loading = false;
  }
};

const sendFriendRequest = async () => {
  if (!state.profile || state.sending) return;
  state.sending = true;
  try {
    await socialApi.sendFriendRequest(state.profile.id, '你好，想加你为好友～');
    ElMessage.success('好友申请已发送');
    state.profile = { ...state.profile, friend_status: 'pending_sent' };
  } catch {
    ElMessage.error('发送申请失败');
  } finally {
    state.sending = false;
  }
};

const friendActionText = computed(() => {
  const status = state.profile?.friend_status;
  if (status === 'friends') return '已是好友';
  if (status === 'pending_sent') return '已发送申请';
  if (status === 'pending_received') return '对方已申请你';
  if (status === 'self') return '这是你自己';
  return '加为好友';
});

const canSendFriendRequest = computed(() => state.profile?.friend_status === 'none');
const canOpenChat = computed(() => state.profile?.friend_status === 'friends');

const goToChat = async () => {
  if (!state.profile || !canOpenChat.value) return;
  visible.value = false;
  await router.push({ path: '/chat', query: { friendId: String(state.profile.id) } });
};

const readPet = (pet: unknown) => pet as PublicPetDetail;

defineExpose({ loadProfile });
</script>

<template>
  <el-drawer
    v-model="visible"
    title="用户资料"
    direction="rtl"
    size="460px"
    class="public-profile-drawer"
    @open="loadProfile"
  >
    <div v-loading="state.loading" class="profile-wrap">
      <template v-if="profile">
        <div class="hero">
          <el-avatar :size="72" :src="profile.avatar" class="hero-avatar" />
          <div class="hero-meta">
            <h3>{{ profile.username }}</h3>
            <p>{{ profile.bio || '这个用户还没有填写简介' }}</p>
          </div>
          <div class="hero-actions">
            <el-button
              type="primary"
              class="friend-btn"
              :disabled="!canSendFriendRequest"
              :loading="state.sending"
              @click="sendFriendRequest"
            >
              {{ friendActionText }}
            </el-button>
            <el-button
              v-if="canOpenChat"
              class="chat-btn"
              @click="goToChat"
            >
              发私聊
            </el-button>
          </div>
        </div>

        <div class="section-card">
          <div class="section-title">TA 的宠物</div>
          <template v-if="!profile.show_pets_public">
            <p class="muted">TA 选择了不公开宠物信息</p>
          </template>
          <template v-else-if="profile.pets.length === 0">
            <p class="muted">还没有公开的宠物档案</p>
          </template>
          <template v-else>
            <div class="pet-grid">
              <div v-for="pet in profile.pets" :key="pet.id" class="pet-card">
                <el-image v-if="pet.image" :src="pet.image" class="pet-cover" fit="cover" referrerPolicy="no-referrer" />
                <div class="pet-name">{{ pet.name }}</div>

                <template v-if="profile.show_pet_details_public">
                  <div class="pet-meta">{{ readPet(pet).breed }} · {{ readPet(pet).gender }}</div>
                  <div class="pet-meta">{{ readPet(pet).birthday?.slice(0, 10) }} · {{ calcAge(readPet(pet).birthday) }}</div>
                  <div class="pet-desc">{{ readPet(pet).description || '暂无描述' }}</div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </el-drawer>
</template>

<style scoped>
.profile-wrap { padding: 4px 6px; }
.hero {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
}
.hero-meta h3 { margin: 0; font-size: 22px; font-weight: 900; color: var(--dark-charcoal); }
.hero-meta p { margin: 6px 0 0; color: var(--text-secondary); font-size: 14px; line-height: 1.6; }
.friend-btn {
  align-self: flex-start;
  background: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
}
.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.chat-btn {
  align-self: flex-start;
  font-weight: 800;
  color: var(--dark-charcoal);
}
.section-card {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 16px;
}
.section-title { font-size: 16px; font-weight: 900; color: var(--dark-charcoal); margin-bottom: 12px; }
.muted { margin: 0; color: var(--text-secondary); font-weight: 700; }
.pet-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.pet-card {
  border-radius: var(--border-radius-md);
  background: var(--bg-color);
  padding: 10px;
}
.pet-cover {
  width: 100%;
  height: 140px;
  border-radius: 10px;
  margin-bottom: 8px;
}
.pet-name { font-size: 15px; font-weight: 900; color: var(--dark-charcoal); margin-bottom: 4px; }
.pet-meta { font-size: 12px; color: var(--text-secondary); font-weight: 700; margin-bottom: 2px; }
.pet-desc { font-size: 12px; color: var(--dark-charcoal); line-height: 1.6; margin-top: 4px; }
</style>

