<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { socialApi, userApi, type FriendItem, type FriendRequest, type PrivateMessage } from '@/api';
import PublicProfileDrawer from '@/components/PublicProfileDrawer.vue';
import CollapsePanel from './components/CollapsePanel.vue';

const friends = ref<FriendItem[]>([]);
const pendingRequests = ref<FriendRequest[]>([]);
const activeFriendId = ref<number | null>(null);
const messages = ref<PrivateMessage[]>([]);
const unreadDividerMessageId = ref<number | null>(null);
const messageListRef = ref<HTMLElement | null>(null);
const loadingFriends = ref(false);
const loadingMessages = ref(false);
const loadingRequests = ref(false);
const sending = ref(false);
const inputText = ref('');
const pollTimer = ref<number | null>(null);
const pollIntervalMs = 8000;
const hasLoadedFriendsOnce = ref(false);
const unreadSnapshot = ref<Record<number, number>>({});

const publicProfileVisible = ref(false);
const selectedUserId = ref<number | null>(null);

const currentUserId = Number(localStorage.getItem('userId') || 0);
const route = useRoute();

const isRequestsExpanded = ref(true);
const isFriendsExpanded = ref(false);

watch(pendingRequests, (newVal) => {
  if (newVal.length > 0) isRequestsExpanded.value = true;
});

const conversationList = computed(() => {
  // 会话列表：有聊天记录的，或是临时会话的，或是当前选中的
  return friends.value.filter(f => f.last_message || f.is_friend === 0 || f.id === activeFriendId.value);
});

const friendList = computed(() => {
  // 好友列表：仅包含真正的的好友
  return friends.value.filter(f => f.is_friend === 1);
});

const showUserProfile = (userId: number) => {
  selectedUserId.value = userId;
  publicProfileVisible.value = true;
};

const TEMP_CHATS_KEY = 'pawcircle_temp_chats_' + currentUserId;

const getTempChats = (): FriendItem[] => {
  try {
    return JSON.parse(localStorage.getItem(TEMP_CHATS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveTempChats = (chats: FriendItem[]) => {
  localStorage.setItem(TEMP_CHATS_KEY, JSON.stringify(chats));
};

const activeFriend = computed(() =>
  friends.value.find(f => f.id === activeFriendId.value) || null
);

const formatFriendTime = (time?: string) => {
  if (!time) return '';
  const d = new Date(time);
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const moveFriendToTop = (friendId: number) => {
  const idx = friends.value.findIndex(f => f.id === friendId);
  if (idx <= 0) return;
  const [friend] = friends.value.splice(idx, 1);
  friends.value.unshift(friend);
};

const scrollMessagesToBottom = async () => {
  await nextTick();
  if (!messageListRef.value) return;
  messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
};

const isMessageListNearBottom = () => {
  if (!messageListRef.value) return true;
  const el = messageListRef.value;
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  return distance < 80;
};

const loadFriends = async () => {
  loadingFriends.value = true;
  try {
    const wasFirstLoad = !hasLoadedFriendsOnce.value;
    const routeFriendId = Number(route.query.friendId || 0);
    const res = await socialApi.getFriends();
    const incoming = (res.data || []).map(item => ({
      ...item,
      unread_count: Number(item.unread_count || 0),
    }));

    const incomingIds = new Set(incoming.map(f => f.id));
    let tempChats = getTempChats();
    const originalTempCount = tempChats.length;
    // 如果临时会话已经出现在接口返回的列表里（比如双方发了消息或成为好友），则从本地临时缓存中移除
    tempChats = tempChats.filter(f => !incomingIds.has(f.id));
    if (tempChats.length !== originalTempCount) {
      saveTempChats(tempChats);
    }

    if (wasFirstLoad) {
      friends.value = [...tempChats, ...incoming];
      hasLoadedFriendsOnce.value = true;
    } else {
      const oldMap = new Map(friends.value.map(f => [f.id, f]));
      const currentActiveId = activeFriendId.value;

      const merged = incoming.map(item => {
        const old = oldMap.get(item.id);
        if (!old) return item;

        if (currentActiveId === item.id) {
          return {
            ...item,
            unread_count: 0,
            last_message: old.last_message,
            last_message_time: old.last_message_time,
          };
        }

        if (old.last_message_time && item.last_message_time && old.last_message_time > item.last_message_time) {
          return {
            ...item,
            last_message: old.last_message,
            last_message_time: old.last_message_time,
          };
        }

        return item;
      });

      // 保持本地临时会话与合并后的列表组合
      const mergedTempChats = tempChats.map(item => oldMap.get(item.id) || item);
      friends.value = [...mergedTempChats, ...merged];
    }

    if (routeFriendId && !friends.value.some(friend => friend.id === routeFriendId)) {
      try {
        const profileRes = await userApi.getPublicProfile(routeFriendId);
        if (profileRes.data) {
          const newTempChat = {
            id: profileRes.data.id,
            username: profileRes.data.username,
            avatar: profileRes.data.avatar,
            bio: profileRes.data.bio || '',
            friend_since: new Date().toISOString(),
            unread_count: 0,
            is_friend: 0
          };
          friends.value.unshift(newTempChat);
          
          tempChats.unshift(newTempChat);
          if (tempChats.length > 20) tempChats.pop();
          saveTempChats(tempChats);
        }
      } catch (err) {
        // 如果获取失败，则不处理
      }
    }

    if (!wasFirstLoad) {
      for (const friend of friends.value) {
        const prevUnread = unreadSnapshot.value[friend.id] || 0;
        if (friend.id !== activeFriendId.value && friend.unread_count > prevUnread && friend.last_message) {
          ElMessage({
            type: 'info',
            message: `${friend.username}：${friend.last_message}`,
            duration: 1800,
            showClose: false,
          });
        }
      }
    }

    unreadSnapshot.value = Object.fromEntries(
      friends.value.map(friend => [friend.id, Number(friend.unread_count || 0)])
    );

    if (routeFriendId && friends.value.some(friend => friend.id === routeFriendId)) {
      activeFriendId.value = routeFriendId;
    } else if (!activeFriendId.value && friends.value.length > 0) {
      activeFriendId.value = friends.value[0].id;
    }
  } catch {
    ElMessage.error('加载好友列表失败');
  } finally {
    loadingFriends.value = false;
  }
};

const loadPendingRequests = async () => {
  loadingRequests.value = true;
  try {
    const res = await socialApi.getPendingRequests();
    pendingRequests.value = res.data;
  } catch {
    ElMessage.error('加载好友申请失败');
  } finally {
    loadingRequests.value = false;
  }
};

const acceptRequest = async (requestId: number) => {
  try {
    await socialApi.acceptFriendRequest(requestId);
    ElMessage.success('已添加为好友');
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId);
    await loadFriends();
  } catch {
    ElMessage.error('处理好友申请失败');
  }
};

const rejectRequest = async (requestId: number) => {
  try {
    await socialApi.rejectFriendRequest(requestId);
    ElMessage.success('已拒绝好友申请');
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId);
  } catch {
    ElMessage.error('处理好友申请失败');
  }
};

const loadMessages = async () => {
  if (!activeFriendId.value) {
    messages.value = [];
    unreadDividerMessageId.value = null;
    return;
  }
  loadingMessages.value = true;
  try {
    const currentFriend = friends.value.find(f => f.id === activeFriendId.value);
    const unreadBefore = Number(currentFriend?.unread_count || 0);

    const res = await socialApi.getMessagesWithFriend(activeFriendId.value, 1, 80);
    messages.value = res.data.items;

    if (unreadBefore > 0 && messages.value.length >= unreadBefore) {
      const firstUnread = messages.value[messages.value.length - unreadBefore];
      unreadDividerMessageId.value = firstUnread?.id || null;
    } else {
      unreadDividerMessageId.value = null;
    }

    friends.value = friends.value.map(f =>
      f.id === activeFriendId.value ? { ...f, unread_count: 0 } : f
    );

    await scrollMessagesToBottom();
  } catch {
    ElMessage.error('加载聊天记录失败');
  } finally {
    loadingMessages.value = false;
  }
};

const isTempChat = computed(() => {
  if (!activeFriend.value) return false;
  return activeFriend.value.is_friend === 0;
});

const canSendMessage = computed(() => {
  if (!isTempChat.value) return true;
  // 临时会话：如果有发送记录且对方没回，就不让发
  let sentCount = 0;
  let repliedCount = 0;
  for (const msg of messages.value) {
    if (msg.sender_id === currentUserId) sentCount++;
    else repliedCount++;
  }
  return sentCount === 0 || repliedCount > 0;
});

const sendMessage = async () => {
  if (!activeFriendId.value || !inputText.value.trim() || sending.value) return;
  if (!canSendMessage.value) {
    ElMessage.warning('临时会话：您已发送过消息，请等待对方回复后再继续。');
    return;
  }
  if (inputText.value.length > 150) {
    ElMessage.warning('临时会话：消息不能超过150字。');
    return;
  }
  const friendId = activeFriendId.value;
  const content = inputText.value.trim();
  sending.value = true;
  try {
    const res = await socialApi.sendMessageToFriend(friendId, content);
    const newMessage = res.data;
    messages.value.push(newMessage);

    const idx = friends.value.findIndex(f => f.id === friendId);
    if (idx >= 0) {
      const target = friends.value[idx];
      friends.value[idx] = {
        ...target,
        last_message: newMessage.content,
        last_message_time: newMessage.created_at,
      };
      moveFriendToTop(friendId);
    }

    unreadDividerMessageId.value = null;
    inputText.value = '';
    await scrollMessagesToBottom();
  } catch {
    ElMessage.error('发送失败，请重试');
  } finally {
    sending.value = false;
  }
};

const pollMessagesForActiveFriend = async () => {
  if (!activeFriendId.value || loadingMessages.value) return;
  const friendId = activeFriendId.value;
  const wasNearBottom = isMessageListNearBottom();

  try {
    const res = await socialApi.getMessagesWithFriend(friendId, 1, 80);
    const nextItems = res.data.items || [];
    const prevLastId = messages.value.length > 0 ? messages.value[messages.value.length - 1].id : null;

    messages.value = nextItems;

    const idx = friends.value.findIndex(f => f.id === friendId);
    if (idx >= 0 && nextItems.length > 0) {
      const tail = nextItems[nextItems.length - 1];
      const hadNewMessage = prevLastId !== tail.id;
      const base = friends.value[idx];
      friends.value[idx] = {
        ...base,
        unread_count: 0,
        last_message: tail.content,
        last_message_time: tail.created_at,
      };

      if (hadNewMessage) {
        moveFriendToTop(friendId);
      }
    }

    unreadDividerMessageId.value = null;
    if (wasNearBottom || prevLastId !== (nextItems[nextItems.length - 1]?.id ?? null)) {
      await scrollMessagesToBottom();
    }
  } catch {
    // 轮询静默失败，避免打扰用户
  }
};

const startPolling = () => {
  stopPolling();
  pollTimer.value = window.setInterval(async () => {
    await Promise.all([loadPendingRequests(), loadFriends(), pollMessagesForActiveFriend()]);
  }, pollIntervalMs);
};

const stopPolling = () => {
  if (pollTimer.value !== null) {
    window.clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
};

watch(activeFriendId, async (newFriendId) => {
  if (newFriendId) {
    await socialApi.markMessagesAsRead(newFriendId);
    unreadSnapshot.value[newFriendId] = 0;
  }
  loadMessages();
});

watch(
  () => route.query.friendId,
  async (value) => {
    const friendId = Number(value || 0);
    if (!friendId) return;

    if (friends.value.some(friend => friend.id === friendId)) {
      activeFriendId.value = friendId;
    } else {
      try {
        const profileRes = await userApi.getPublicProfile(friendId);
        if (profileRes.data) {
          const newTempChat = {
            id: profileRes.data.id,
            username: profileRes.data.username,
            avatar: profileRes.data.avatar,
            bio: profileRes.data.bio || '',
            friend_since: new Date().toISOString(),
            unread_count: 0,
            is_friend: 0
          };
          friends.value.unshift(newTempChat);
          activeFriendId.value = friendId;
          
          let tempChats = getTempChats();
          if (!tempChats.some(f => f.id === newTempChat.id)) {
            tempChats.unshift(newTempChat);
            if (tempChats.length > 20) tempChats.pop();
            saveTempChats(tempChats);
          }
        }
      } catch (err) {
        ElMessage.error('无法获取该用户信息');
      }
    }
  }
);

onMounted(async () => {
  await Promise.all([loadFriends(), loadPendingRequests()]);
  await loadMessages();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="chat-page">
    <div class="chat-layout">
      <aside class="friend-panel">
        <CollapsePanel title="好友申请" v-model="isRequestsExpanded">
          <div v-loading="loadingRequests" class="request-list">
            <div v-if="pendingRequests.length === 0" class="empty-text">暂无新的申请</div>
            <div v-for="item in pendingRequests" :key="item.id" class="request-item">
              <div class="request-user">
                <el-avatar 
                  :size="34" 
                  :src="item.sender.avatar" 
                  @click.stop="showUserProfile(item.sender.id)" 
                  style="cursor: pointer" 
                />
                <span @click.stop="showUserProfile(item.sender.id)" style="cursor: pointer">{{ item.sender.username }}</span>
              </div>
              <div class="request-actions">
                <el-button type="primary" size="small" class="accept-btn" @click="acceptRequest(item.id)">同意</el-button>
                <el-button size="small" class="reject-btn" @click="rejectRequest(item.id)">拒绝</el-button>
              </div>
            </div>
          </div>
        </CollapsePanel>

        <CollapsePanel title="好友列表" v-model="isFriendsExpanded">
          <div v-loading="loadingFriends" class="friend-list">
            <div v-if="friendList.length === 0" class="empty-text">还没有好友，先去动态里加好友吧</div>
            <div
              v-for="friend in friendList"
              :key="friend.id"
              class="friend-item"
              :class="{ active: activeFriendId === friend.id }"
              @click="activeFriendId = friend.id"
            >
              <el-avatar :size="36" :src="friend.avatar" />
              <div class="friend-meta">
                <div class="name-row">
                  <div class="name">{{ friend.username }}</div>
                </div>
                <div class="bio">{{ friend.bio || '这个好友还没有写简介' }}</div>
              </div>
            </div>
          </div>
        </CollapsePanel>

        <CollapsePanel title="会话列表" :collapsible="false">
          <div v-loading="loadingFriends" class="friend-list">
            <div v-if="conversationList.length === 0" class="empty-text">暂无近期会话</div>
            <div
              v-for="friend in conversationList"
              :key="friend.id"
              class="friend-item"
              :class="{ active: activeFriendId === friend.id }"
              @click="activeFriendId = friend.id"
            >
              <el-avatar :size="36" :src="friend.avatar" />
              <div class="friend-meta">
                <div class="name-row">
                  <div class="name">{{ friend.username }}</div>
                  <el-tag v-if="friend.is_friend === 0" size="small" type="warning" class="list-temp-tag">临时会话</el-tag>
                  <el-badge
                    v-if="friend.unread_count > 0"
                    :value="friend.unread_count > 99 ? '99+' : friend.unread_count"
                    class="unread-badge"
                  />
                </div>
                <div class="bio">{{ friend.last_message || friend.bio || '暂无消息' }}</div>
                <div v-if="friend.last_message_time" class="last-time">{{ formatFriendTime(friend.last_message_time) }}</div>
              </div>
            </div>
          </div>
        </CollapsePanel>
      </aside>

      <section class="chat-panel">
        <template v-if="activeFriend">
          <div class="chat-header">
            <el-avatar :size="38" :src="activeFriend.avatar" />
            <div class="chat-user">
              {{ activeFriend.username }}
              <el-tag v-if="isTempChat" size="small" type="warning" class="temp-tag">临时会话</el-tag>
            </div>
          </div>
          
          <div v-if="isTempChat" class="temp-notice">
            <el-alert 
              title="你们还不是好友。为防止打扰，对方回复前您只能发送 1 条且不超过 150 字的消息。" 
              type="warning" 
              show-icon 
              :closable="false"
            />
          </div>

          <div v-loading="loadingMessages" ref="messageListRef" class="message-list">
            <template v-for="msg in messages" :key="msg.id">
              <div v-if="unreadDividerMessageId === msg.id" class="unread-divider">—— 以下是未读消息 ——</div>
              <div
                class="message-item"
                :class="{ mine: msg.sender_id === currentUserId }"
              >
                <div class="bubble">{{ msg.content }}</div>
                <div class="time">{{ new Date(msg.created_at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</div>
              </div>
            </template>
          </div>

          <div class="composer">
            <el-input
              v-model="inputText"
              :placeholder="canSendMessage ? '输入消息...' : '等待对方回复后才可继续发送...'"
              :disabled="!canSendMessage"
              :maxlength="isTempChat ? 150 : undefined"
              :show-word-limit="isTempChat"
              @keyup.enter="sendMessage"
            />
            <el-button type="primary" class="send-btn" :loading="sending" :disabled="!canSendMessage" @click="sendMessage">发送</el-button>
          </div>
        </template>

        <template v-else>
          <div class="empty-chat">选择一个好友开始聊天</div>
        </template>
      </section>
    </div>
    
    <!-- 个人资料抽屉 -->
    <PublicProfileDrawer v-model="publicProfileVisible" :user-id="selectedUserId" />
  </div>
</template>

<style scoped>
.chat-page { padding-bottom: 26px; }
.chat-layout {
  display: grid;
  grid-template-columns: 30% 70%;
  gap: 16px;
}
.friend-panel,
.chat-panel {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
}
.friend-panel { padding: 14px; }
.request-list,
.friend-list { display: flex; flex-direction: column; gap: 8px; }
.request-item,
.friend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 12px;
  padding: 8px;
  background: var(--bg-color);
}
.request-user { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.request-actions { display: flex; align-items: center; gap: 6px; }
.accept-btn {
  background: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
}
.reject-btn {
  color: var(--text-secondary);
  font-weight: 700;
}
.friend-item { cursor: pointer; justify-content: flex-start; }
.friend-item.active { outline: 2px solid var(--primary-yellow); }
.friend-meta { min-width: 0; }
.friend-meta .name-row { display: flex; align-items: center; gap: 8px; }
.friend-meta .name { font-size: 14px; font-weight: 800; color: var(--dark-charcoal); }
.list-temp-tag { font-weight: 700; transform: scale(0.9); transform-origin: left center; }
.unread-badge :deep(.el-badge__content) {
  background: #ff4d4f;
  border: none;
  font-weight: 700;
}
.friend-meta .bio { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
.friend-meta .last-time { font-size: 11px; color: #a0a0a0; margin-top: 2px; }
.empty-text { font-size: 13px; color: var(--text-secondary); font-weight: 700; }

.chat-panel {
  min-height: 620px;
  display: flex;
  flex-direction: column;
}
.chat-header {
  height: 62px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
}
.chat-user { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 900; color: var(--dark-charcoal); }
.temp-tag { font-weight: 700; border-radius: 4px; }
.temp-notice {
  padding: 10px 14px 0;
}
.message-list {
  flex: 1;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: 500px;
}
.message-item { display: flex; flex-direction: column; align-items: flex-start; }
.message-item.mine { align-items: flex-end; }
.bubble {
  max-width: 70%;
  background: #f4f4f5;
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 14px;
  color: var(--dark-charcoal);
  line-height: 1.55;
}
.message-item.mine .bubble {
  background: var(--primary-yellow);
}
.time { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
.unread-divider {
  align-self: center;
  font-size: 12px;
  color: #ff7a00;
  font-weight: 800;
  background: #fff8eb;
  border: 1px dashed #ffd591;
  border-radius: 999px;
  padding: 4px 12px;
}
.composer {
  border-top: 1px solid #f0f0f0;
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}
.send-btn {
  background: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
}
.empty-chat {
  margin: auto;
  color: var(--text-secondary);
  font-weight: 800;
}

@media (max-width: 960px) {
  .chat-layout { grid-template-columns: 1fr; }
  .chat-panel { min-height: 520px; }
}
</style>

