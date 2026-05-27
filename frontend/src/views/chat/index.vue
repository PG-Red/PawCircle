<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, Picture, Postcard, Close } from '@element-plus/icons-vue';
import { socialApi, userApi, type FriendItem, type FriendRequest, type PrivateMessage } from '@/api';
import type { Pet } from '@/api/pet';
import PublicProfileDrawer from '@/components/PublicProfileDrawer.vue';
import CollapsePanel from './components/CollapsePanel.vue';
import PetCardPicker from './components/PetCardPicker.vue';
import PetDetailDialog from '@/components/PetDetailDialog.vue';
import { defaultAvatar } from '@/utils/constants';
import { fetchUnreadSummary, globalFriends, globalRequests, globalMessageCache, globalMessageHasMore, globalMessagePage } from '@/utils/unreadState';

import { eventBus } from '@/utils/eventBus';

const friends = ref<FriendItem[]>(globalFriends.value || []);
const pendingRequests = ref<FriendRequest[]>(globalRequests.value || []);
const activeFriendId = ref<number | null>(null);
const messages = ref<PrivateMessage[]>([]);
const unreadDividerMessageId = ref<number | null>(null);
const messageListRef = ref<HTMLElement | null>(null);
const loadingFriends = ref(false);
const loadingMessages = ref(false);
const loadingRequests = ref(false);
const loadingMoreMessages = ref(false);
const hasMoreMessages = ref(false);
const currentPage = ref(1);
const PAGE_SIZE = 30;
const sending = ref(false);
const inputText = ref('');
const inputImage = ref('');
const imageInputRef = ref<HTMLInputElement | null>(null);
const previewVisible = ref(false);
const previewImage = ref('');
const pollTimer = ref<number | null>(null);
const pollIntervalMs = 8000;
const hasLoadedFriendsOnce = ref(false);
const unreadSnapshot = ref<Record<number, number>>({});

const searchDialogVisible = ref(false);
const searchType = ref<'name' | 'id'>('name');
const searchKeyword = ref('');
const searchResults = ref<any[]>([]);
const searching = ref(false);

const openSearchDialog = () => {
  searchDialogVisible.value = true;
};

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return;
  searching.value = true;
  try {
    const res = await userApi.searchUsers(searchKeyword.value.trim(), searchType.value);
    searchResults.value = res.data;
    if (searchResults.value.length === 0) {
      ElMessage.info('未找到匹配的用户');
    }
  } catch (err) {
    ElMessage.error('搜索失败，请稍后重试');
  } finally {
    searching.value = false;
  }
};

const sendFriendRequest = async (userId: number) => {
  try {
    await socialApi.sendFriendRequest(userId);
    ElMessage.success('好友申请已发送');
    // 更新结果列表中的状态
    const user = searchResults.value.find(u => u.id === userId);
    if (user) user.friend_status = 'pending_sent';
  } catch (err: any) {
    ElMessage.error(err?.message || '发送申请失败');
  }
};


const publicProfileVisible = ref(false);
const selectedUserId = ref<number | null>(null);

const currentUserId = Number(localStorage.getItem('userId') || 0);
const currentUserAvatar = ref('');
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

const tempConversationList = computed(() =>
  conversationList.value.filter(f => f.is_friend === 0)
);

const normalConversationList = computed(() =>
  conversationList.value.filter(f => f.is_friend !== 0)
);

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
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

// 5 分钟内活跃视为在线
const isOnline = (lastActiveAt?: string) => {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000;
};

const formatMessageTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeString = date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (isToday) {
    return timeString;
  } else if (isYesterday) {
    return `昨天 ${timeString}`;
  } else {
    const yearStr = date.getFullYear() !== now.getFullYear() ? `${date.getFullYear()}-` : '';
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${yearStr}${month}-${day} ${timeString}`;
  }
};

// 解析宠物档案消息
const parsePetCard = (content: string) => {
  try {
    return JSON.parse(content.slice('[pet_card]'.length)) as {
      id: number; name: string; breed: string; gender: string;
      birthday: string; image: string; description: string;
    };
  } catch {
    return null;
  }
};

const formatLastMessage = (msg?: string) => {
  if (!msg) return '';
  if (msg.startsWith('[pet_card]')) {
    const pet = parsePetCard(msg);
    return pet ? `[宠物档案] ${pet.name}` : '[宠物档案]';
  }
  return msg;
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

const loadFriends = async (silent = false) => {
  if (!silent && friends.value.length === 0) loadingFriends.value = true;
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
            message: `${friend.username}：${formatLastMessage(friend.last_message)}`,
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
    } else     if (!activeFriendId.value && friends.value.length > 0) {
      activeFriendId.value = friends.value[0].id;
    }
    globalFriends.value = friends.value;
  } catch {
    ElMessage.error('加载好友列表失败');
  } finally {
    if (!silent) loadingFriends.value = false;
  }
};

const loadPendingRequests = async (silent = false) => {
  if (!silent && pendingRequests.value.length === 0) loadingRequests.value = true;
  try {
    const res = await socialApi.getPendingRequests();
    pendingRequests.value = res.data;
    globalRequests.value = res.data;
  } catch {
    ElMessage.error('加载好友申请失败');
  } finally {
    if (!silent) loadingRequests.value = false;
  }
};

const acceptRequest = async (requestId: number) => {
  try {
    await socialApi.acceptFriendRequest(requestId);
    ElMessage.success('已添加为好友');
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId);
    fetchUnreadSummary();
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
    fetchUnreadSummary();
  } catch {
    ElMessage.error('处理好友申请失败');
  }
};

const loadMessages = async () => {
  if (!activeFriendId.value) {
    messages.value = [];
    unreadDividerMessageId.value = null;
    hasMoreMessages.value = false;
    currentPage.value = 1;
    return;
  }
  
  const friendId = activeFriendId.value;
  if (globalMessageCache.value[friendId]) {
    messages.value = globalMessageCache.value[friendId];
    hasMoreMessages.value = globalMessageHasMore.value[friendId] || false;
    currentPage.value = globalMessagePage.value[friendId] || 1;
    loadingMessages.value = false;
  } else {
    messages.value = [];
    hasMoreMessages.value = false;
    currentPage.value = 1;
    loadingMessages.value = true;
  }
  
  unreadDividerMessageId.value = null;
  
  try {
    const currentFriend = friends.value.find(f => f.id === friendId);
    const unreadBefore = Number(currentFriend?.unread_count || 0);

    const res = await socialApi.getMessagesWithFriend(friendId, 1, Math.max(currentPage.value * PAGE_SIZE, PAGE_SIZE));
    messages.value = res.data.items;
    
    // 更新缓存
    globalMessageCache.value[friendId] = messages.value;
    globalMessageHasMore.value[friendId] = res.data.total > messages.value.length;
    hasMoreMessages.value = globalMessageHasMore.value[friendId];
    
    if (unreadBefore > 0 && messages.value.length >= unreadBefore) {
      const firstUnread = messages.value[messages.value.length - unreadBefore];
      unreadDividerMessageId.value = firstUnread?.id || null;
    } else {
      unreadDividerMessageId.value = null;
    }

    friends.value = friends.value.map(f =>
      f.id === friendId ? { ...f, unread_count: 0 } : f
    );
    
    fetchUnreadSummary();

    await scrollMessagesToBottom();
  } catch {
    ElMessage.error('加载聊天记录失败');
  } finally {
    loadingMessages.value = false;
  }
};

// 加载更多历史消息（上拉/滚到顶部）
const loadMoreMessages = async () => {
  if (!activeFriendId.value || loadingMoreMessages.value || !hasMoreMessages.value) return;
  loadingMoreMessages.value = true;
  try {
    const nextPage = currentPage.value + 1;
    const res = await socialApi.getMessagesWithFriend(activeFriendId.value, nextPage, PAGE_SIZE);
    const older = res.data.items;
    if (older.length === 0) {
      hasMoreMessages.value = false;
      return;
    }
    // 记录当前滚动锚点（列表中第一条消息），加载后恢复位置
    const el = messageListRef.value;
    const firstMsgEl = el?.querySelector<HTMLElement>('.message-item');
    const prevScrollHeight = el?.scrollHeight || 0;

    messages.value = [...older, ...messages.value];
    currentPage.value = nextPage;
    hasMoreMessages.value = res.data.total > nextPage * PAGE_SIZE;

    // 更新缓存
    globalMessageCache.value[activeFriendId.value] = messages.value;
    globalMessagePage.value[activeFriendId.value] = currentPage.value;
    globalMessageHasMore.value[activeFriendId.value] = hasMoreMessages.value;

    await nextTick();
    if (el) {
      el.scrollTop = el.scrollHeight - prevScrollHeight;
    }
    // 首次加载后若第一条消息已经覆盖了更早的记录，提示加载完毕
    if (!hasMoreMessages.value) {
      // 不弹提示，列表顶部提示消失即可
    }
    void firstMsgEl; // suppress unused warning
  } catch {
    ElMessage.error('加载更多消息失败');
  } finally {
    loadingMoreMessages.value = false;
  }
};

const isTempChat = computed(() => {
  if (!activeFriend.value) return false;
  return activeFriend.value.is_friend === 0;
});

// 临时会话中，对方是发起方（第一条消息不是我发的）
const isTempChatReceiver = computed(() => {
  if (!isTempChat.value || messages.value.length === 0) return false;
  return messages.value[0].sender_id !== currentUserId;
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

const handleImageSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  (e.target as HTMLInputElement).value = '';

  const MAX_SIZE = 800; // 最大边长 px
  const QUALITY = 0.7;

  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(objectUrl);
    let { width, height } = img;
    if (width > MAX_SIZE || height > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
    inputImage.value = canvas.toDataURL('image/jpeg', QUALITY);
  };
  img.src = objectUrl;
};

const openPreview = (src: string) => {
  previewImage.value = src;
  previewVisible.value = true;
};

const petCardPickerVisible = ref(false);

const activePetDetailId = ref<number | null>(null);
const petDetailVisible = ref(false);
const activePetDetailData = ref<any>(null);

const openPetDetail = (petCardData: any) => {
  activePetDetailId.value = petCardData.id;
  activePetDetailData.value = petCardData;
  petDetailVisible.value = true;
};

const sendPetCard = async (pet: Pet) => {
  petCardPickerVisible.value = false;
  if (!activeFriendId.value || sending.value) return;
  if (!canSendMessage.value) {
    ElMessage.warning('临时会话：您已发送过消息，请等待对方回复后再继续。');
    return;
  }
  const friendId = activeFriendId.value;
  const content = `[pet_card]${JSON.stringify({
    id: pet.id,
    name: pet.name,
    breed: pet.breed,
    gender: pet.gender,
    birthday: pet.birthday,
    image: pet.image,
    description: pet.description,
  })}`;
  sending.value = true;
  try {
    const res = await socialApi.sendMessageToFriend(friendId, content);
    const newMessage = res.data;
    messages.value.push(newMessage);
    const idx = friends.value.findIndex(f => f.id === friendId);
    if (idx >= 0) {
      friends.value[idx] = {
        ...friends.value[idx],
        last_message: `[宠物档案] ${pet.name}`,
        last_message_time: newMessage.created_at,
      };
      moveFriendToTop(friendId);
    }
    await scrollMessagesToBottom();
  } catch (err: any) {
    ElMessage.error(err?.message || '发送失败，请重试');
  } finally {
    sending.value = false;
  }
};

const sendMessage = async () => {
  if (!activeFriendId.value || sending.value) return;
  if (!inputText.value.trim() && !inputImage.value) return;
  if (!canSendMessage.value) {
    ElMessage.warning('临时会话：您已发送过消息，请等待对方回复后再继续。');
    return;
  }
  const friendId = activeFriendId.value;
  const content = inputText.value.trim();
  const image = inputImage.value || undefined;
  sending.value = true;
  try {
    const res = await socialApi.sendMessageToFriend(friendId, content, image);
    const newMessage = res.data;
    messages.value.push(newMessage);
    globalMessageCache.value[friendId] = messages.value;

    const idx = friends.value.findIndex(f => f.id === friendId);
    if (idx >= 0) {
      const target = friends.value[idx];
      friends.value[idx] = {
        ...target,
        last_message: newMessage.content || '[图片]',
        last_message_time: newMessage.created_at,
      };
      moveFriendToTop(friendId);
    }

    unreadDividerMessageId.value = null;
    inputText.value = '';
    inputImage.value = '';
    await scrollMessagesToBottom();
  } catch (err: any) {
    const msg = err?.message || '发送失败，请重试';
    ElMessage.error(msg);
    console.error('[sendMessage error]', err);
  } finally {
    sending.value = false;
  }
};

const pollMessagesForActiveFriend = async () => {
  if (!activeFriendId.value || loadingMessages.value) return;
  const friendId = activeFriendId.value;
  const wasNearBottom = isMessageListNearBottom();

  try {
    // 轮询始终拉取第 1 页最新消息（保持与当前已加载数量一致，最多取已加载页数 * PAGE_SIZE）
    const fetchCount = Math.max(currentPage.value * PAGE_SIZE, PAGE_SIZE);
    const res = await socialApi.getMessagesWithFriend(friendId, 1, fetchCount);
    const nextItems = res.data.items || [];
    const prevLastId = messages.value.length > 0 ? messages.value[messages.value.length - 1].id : null;

    messages.value = nextItems;
    globalMessageCache.value[friendId] = messages.value;

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
    await Promise.all([loadPendingRequests(true), loadFriends(true), pollMessagesForActiveFriend()]);
    fetchUnreadSummary();
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
    fetchUnreadSummary();
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
  eventBus.on('open-add-friend', openSearchDialog);

  // 获取自己的头像用于消息气泡
  try {
    const profileRes = await userApi.getProfile();
    currentUserAvatar.value = profileRes.data.avatar || '';
  } catch {
    // ignore
  }
  await Promise.all([loadFriends(), loadPendingRequests()]);
  await loadMessages();
  startPolling();
});

onUnmounted(() => {
  stopPolling();
  eventBus.off('open-add-friend', openSearchDialog);
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
                  :src="item.sender.avatar || defaultAvatar" 
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
              <div class="avatar-wrap">
                <el-avatar :size="36" :src="friend.avatar || defaultAvatar" />
                <span v-if="isOnline(friend.last_active_at)" class="online-dot" />
              </div>
              <div class="friend-meta">
                <div class="name-row">
                  <div class="name">{{ friend.username }}</div>
                  <span v-if="!isOnline(friend.last_active_at)" class="offline-tag">离线</span>
                </div>
                <div class="bio">{{ friend.bio || '这个好友还没有写简介' }}</div>
              </div>
            </div>
          </div>
        </CollapsePanel>

        <CollapsePanel title="会话列表" :collapsible="false">
          <div v-loading="loadingFriends" class="friend-list">
            <div v-if="conversationList.length === 0" class="empty-text">暂无近期会话</div>

            <!-- 临时会话小区块 -->
            <template v-if="tempConversationList.length > 0">
              <div class="conv-section-label">临时会话</div>
              <div
                v-for="friend in tempConversationList"
                :key="friend.id"
                class="friend-item"
                :class="{ active: activeFriendId === friend.id }"
                @click="activeFriendId = friend.id"
              >
                <div class="avatar-wrap">
                  <el-avatar :size="36" :src="friend.avatar || defaultAvatar" />
                  <span v-if="isOnline(friend.last_active_at)" class="online-dot" />
                </div>
                <div class="friend-meta">
                  <div class="name-row">
                    <div class="name">{{ friend.username }}</div>
                    <span v-if="!isOnline(friend.last_active_at)" class="offline-tag">离线</span>
                  </div>
                  <div class="bio">{{ formatLastMessage(friend.last_message) || friend.bio || '暂无消息' }}</div>
                  <div v-if="friend.last_message_time" class="last-time">{{ formatFriendTime(friend.last_message_time) }}</div>
                </div>
                <el-badge
                  v-if="friend.unread_count > 0"
                  :value="friend.unread_count > 99 ? '99+' : friend.unread_count"
                  class="unread-badge item-badge"
                />
              </div>
              <div v-if="normalConversationList.length > 0" class="conv-section-label">最近会话</div>
            </template>

            <!-- 普通会话 -->
            <div
              v-for="friend in normalConversationList"
              :key="friend.id"
              class="friend-item"
              :class="{ active: activeFriendId === friend.id }"
              @click="activeFriendId = friend.id"
            >
              <div class="avatar-wrap">
                <el-avatar :size="36" :src="friend.avatar || defaultAvatar" />
                <span v-if="isOnline(friend.last_active_at)" class="online-dot" />
              </div>
              <div class="friend-meta">
                <div class="name-row">
                  <div class="name">{{ friend.username }}</div>
                  <span v-if="!isOnline(friend.last_active_at)" class="offline-tag">离线</span>
                </div>
                <div class="bio">{{ formatLastMessage(friend.last_message) || friend.bio || '暂无消息' }}</div>
                <div v-if="friend.last_message_time" class="last-time">{{ formatFriendTime(friend.last_message_time) }}</div>
              </div>
              <el-badge
                v-if="friend.unread_count > 0"
                :value="friend.unread_count > 99 ? '99+' : friend.unread_count"
                class="unread-badge item-badge"
              />
            </div>
          </div>
        </CollapsePanel>
      </aside>

      <section class="chat-panel">
        <template v-if="activeFriend">
          <div class="chat-header">
            <el-avatar
              :size="38"
              :src="activeFriend.avatar || defaultAvatar"
              class="chat-header-avatar"
              @click="showUserProfile(activeFriend.id)"
            />
            <div class="chat-user" @click="showUserProfile(activeFriend.id)">
              {{ activeFriend.username }}
              <el-tag v-if="isTempChat" size="small" type="warning" class="temp-tag">临时会话</el-tag>
            </div>
          </div>

          
          <div v-if="isTempChat" class="temp-notice">
            <el-alert 
              :title="isTempChatReceiver
                ? '对方向您发起了临时会话，您可以回复或忽略。成为好友后即可正常聊天。'
                : '你们还不是好友。为防止打扰，对方回复前您只能发送 1 条且不超过 150 字的消息。'" 
              type="warning" 
              show-icon 
              :closable="false"
            />
          </div>

          <div v-loading="loadingMessages" ref="messageListRef" class="message-list">
            <!-- 加载更多 -->
            <div class="load-more-wrap">
              <el-button
                v-if="hasMoreMessages"
                size="small"
                :loading="loadingMoreMessages"
                class="load-more-btn"
                @click="loadMoreMessages"
              >加载更早的消息</el-button>
              <div v-else-if="messages.length > 0 && !loadingMessages" class="no-more-tip">已加载全部消息</div>
            </div>

            <template v-for="msg in messages" :key="msg.id">
              <div v-if="unreadDividerMessageId === msg.id" class="unread-divider">—— 以下是未读消息 ——</div>
              <div
                class="message-item"
                :class="{ mine: msg.sender_id === currentUserId }"
              >
                <!-- 自己头像（正常序在前，row-reverse 后翻到右侧） -->
                <el-avatar
                  v-if="msg.sender_id === currentUserId"
                  :size="30"
                  :src="currentUserAvatar || defaultAvatar"
                  class="msg-avatar msg-avatar-mine"
                />
                <!-- 对方头像（左侧） -->
                <el-avatar
                  v-if="msg.sender_id !== currentUserId"
                  :size="30"
                  :src="activeFriend.avatar || defaultAvatar"
                  class="msg-avatar msg-avatar-other"
                  @click="showUserProfile(activeFriend.id)"
                />
                <div class="msg-body">
                  <div class="time">
                    {{ formatMessageTime(msg.created_at) }}
                  </div>
                  <div class="bubble-wrapper">
                    <span v-if="msg.sender_id === currentUserId" class="msg-status" :class="{ read: !!msg.is_read }">
                      {{ msg.is_read ? '已读' : '未读' }}
                    </span>
                    <div class="bubble-content">
                      <img v-if="msg.image" :src="msg.image" class="bubble-image" @click="openPreview(msg.image)" loading="lazy" />
                      <template v-if="msg.content">
                        <!-- 宠物档案卡片 -->
                        <div v-if="msg.content.startsWith('[pet_card]')" class="bubble pet-card-bubble" style="cursor: pointer" @click="openPetDetail(parsePetCard(msg.content))">
                          <template v-if="parsePetCard(msg.content)">
                            <el-avatar
                              :size="54"
                              :src="parsePetCard(msg.content)!.image"
                              shape="square"
                              class="pet-card-img"
                            />
                            <div class="pet-card-info">
                              <div class="pet-card-label">宠物档案</div>
                              <div class="pet-card-name">{{ parsePetCard(msg.content)!.name }}</div>
                              <div class="pet-card-sub">{{ parsePetCard(msg.content)!.breed }} · {{ parsePetCard(msg.content)!.gender }}</div>
                              <div v-if="parsePetCard(msg.content)!.description" class="pet-card-desc">{{ parsePetCard(msg.content)!.description }}</div>
                            </div>
                          </template>
                        </div>
                        <!-- 普通消息 -->
                        <div v-else class="bubble">{{ msg.content }}</div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="composer">
            <input ref="imageInputRef" type="file" accept="image/*" style="display:none" @change="handleImageSelect" />
            <!-- 工具栏 -->
            <div class="composer-toolbar">
              <el-tooltip content="发送图片" placement="top" :show-after="400">
                <span
                  class="toolbar-icon"
                  :class="{ disabled: !canSendMessage }"
                  @click="canSendMessage && imageInputRef?.click()"
                >
                  <el-icon><Picture /></el-icon>
                </span>
              </el-tooltip>
              <el-tooltip content="发送宠物档案" placement="top" :show-after="400">
                <span
                  class="toolbar-icon"
                  :class="{ disabled: !canSendMessage }"
                  @click="canSendMessage && (petCardPickerVisible = true)"
                >
                  <el-icon><Postcard /></el-icon>
                </span>
              </el-tooltip>
            </div>
            <!-- 图片预览（选图后显示） -->
            <div v-if="inputImage" class="image-preview-wrap">
              <img :src="inputImage" class="image-preview-thumb" loading="lazy" />
              <el-button class="image-remove-btn" size="small" circle @click="inputImage = ''">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <!-- 输入行 -->
            <div class="composer-input-row">
              <el-input
                class="chat-input"
                v-model="inputText"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 4 }"
                :placeholder="canSendMessage ? '输入消息，Enter 发送，Shift+Enter 换行' : '等待对方回复后才可继续发送...'"
                :disabled="!canSendMessage"
                :maxlength="isTempChat ? 150 : 500"
                :show-word-limit="true"
                resize="none"
                @keydown.enter.prevent="(e: KeyboardEvent) => { if (!e.shiftKey) sendMessage(); else inputText += '\n'; }"
              />
              <el-button type="primary" class="send-btn" :loading="sending" :disabled="!canSendMessage" @click="sendMessage">发送</el-button>
            </div>
          </div>

          <!-- 宠物档案选择器 -->
          <PetCardPicker
            v-if="petCardPickerVisible"
            @select="sendPetCard"
            @close="petCardPickerVisible = false"
          />

          <!-- 点击卡片弹出的宠物详情 -->
          <PetDetailDialog
            v-model="petDetailVisible"
            :pet-id="activePetDetailId"
            :initial-data="activePetDetailData"
          />

          <!-- 图片大图预览 -->
          <el-dialog v-model="previewVisible" width="fit-content" :show-close="true" align-center>
            <img :src="previewImage" style="max-width: 80vw; max-height: 80vh; display: block;" loading="lazy" />
          </el-dialog>
        </template>

        <template v-else>
          <div class="empty-chat">选择一个好友开始聊天</div>
        </template>
      </section>
    </div>
    
    <!-- 个人资料抽屉 -->
    <PublicProfileDrawer v-model="publicProfileVisible" :user-id="selectedUserId" />

    <!-- 添加好友弹窗 -->
    <el-dialog
      v-model="searchDialogVisible"
      title="添加好友"
      width="450px"
      align-center
      class="search-friend-dialog"
    >
      <div class="search-container">
        <div class="search-type-tabs">
          <div 
            class="type-tab" 
            :class="{ active: searchType === 'name' }" 
            @click="searchType = 'name'"
          >搜索用户名</div>
          <div 
            class="type-tab" 
            :class="{ active: searchType === 'id' }" 
            @click="searchType = 'id'"
          >搜索 ID</div>
        </div>

        <div class="search-input-box">
          <el-input
            v-model="searchKeyword"
            :placeholder="searchType === 'name' ? '输入用户名搜索...' : '输入 8 位用户 ID 搜索...'"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button :loading="searching" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>

        <div v-loading="searching" class="search-results">
          <div v-if="searchResults.length === 0 && !searching" class="search-empty">
            <el-empty :image-size="80" description="搜索用户，结交新朋友吧" />
          </div>
          <div v-for="user in searchResults" :key="user.id" class="result-item">
            <el-avatar :size="44" :src="user.avatar || defaultAvatar" @click="showUserProfile(user.id)" style="cursor: pointer" />
            <div class="user-info" @click="showUserProfile(user.id)" style="cursor: pointer">
              <div class="username">{{ user.username }}</div>
              <div class="user-code">ID: {{ user.user_code }}</div>
            </div>
            <div class="action">
              <el-button 
                v-if="user.friend_status === 'none'" 
                type="primary" 
                size="small" 
                class="add-btn"
                @click="sendFriendRequest(user.id)"
              >加好友</el-button>
              <el-tag v-else-if="user.friend_status === 'friends'" type="success" effect="plain">已是好友</el-tag>
              <el-tag v-else-if="user.friend_status === 'pending_sent'" type="info" effect="plain">已申请</el-tag>
              <el-tag v-else-if="user.friend_status === 'pending_received'" type="warning" effect="plain">待通过</el-tag>
              <el-tag v-else-if="user.friend_status === 'self'" type="info" effect="plain">你自己</el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
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
.friend-item { 
  cursor: pointer; 
  justify-content: flex-start; 
  min-height: 60px; 
  transition: transform 0.3s ease;
}
.friend-item:hover {
  transform: scale(1.02);
}
.friend-item.active { outline: 2px solid var(--primary-yellow); }
.avatar-wrap { position: relative; flex-shrink: 0; }
.online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 9px;
  height: 9px;
  background: #22c55e;
  border-radius: 50%;
  border: 2px solid var(--card-bg);
}
.offline-tag {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  color: #aaa;
  font-weight: 500;
  margin-left: 5px;
  padding: 0 6px;
  height: 18px;
  line-height: 1;
  border-radius: 20px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  flex-shrink: 0;
  letter-spacing: 1px;
}
.friend-meta { min-width: 0; flex: 1; }
.friend-meta .name-row { display: flex; align-items: center; gap: 8px; }
.friend-meta .name { font-size: 14px; font-weight: 800; color: var(--dark-charcoal); }
.list-temp-tag { font-weight: 700; transform: scale(0.9); transform-origin: left center; }
.item-badge { margin-left: auto; flex-shrink: 0; align-self: center; }
.unread-badge :deep(.el-badge__content) {
  background: #ff4d4f;
  border: none;
  font-weight: 700;
}
.friend-meta .bio { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
.friend-meta .last-time { font-size: 11px; color: #a0a0a0; margin-top: 2px; }
.empty-text { font-size: 13px; color: var(--text-secondary); font-weight: 700; }
.conv-section-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 700;
  padding: 6px 4px 2px;
  letter-spacing: 0.5px;
}

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
.chat-header-avatar {

  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.chat-header-avatar:hover { opacity: 0.8; }
.chat-user {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 900;
  color: var(--dark-charcoal);
  cursor: pointer;
}
.chat-user:hover { color: var(--primary-yellow); }
.temp-tag { font-weight: 700; border-radius: 4px; }
.temp-notice {
  padding: 10px 14px 0;
}
.message-list {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: 460px;
}
.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 4px 0 6px;
  min-height: 28px;
}
.load-more-btn {
  font-size: 12px;
  color: var(--text-secondary);
  border-color: #e0e0e0;
  border-radius: 999px;
}
.no-more-tip {
  font-size: 12px;
  color: #c0c0c0;
  padding: 4px 0;
}
.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.message-item.mine {
  flex-direction: row-reverse;
}
.msg-avatar {
  flex-shrink: 0;
  cursor: pointer;
  transition: opacity 0.15s;
  align-self: flex-start;
}
.msg-avatar:hover { opacity: 0.8; }
.msg-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 65%;
}
.message-item.mine .msg-body { align-items: flex-end; }
.bubble-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}
.bubble-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.message-item.mine .bubble-content {
  align-items: flex-end;
}
.bubble {
  background: #f4f4f5;
  border-radius: 12px;
  padding: 9px 12px;
  font-size: 14px;
  color: var(--dark-charcoal);
  line-height: 1.55;
  word-break: break-word;
  white-space: pre-wrap;
}
.message-item.mine .bubble {
  background: var(--primary-yellow);
}
.pet-card-bubble {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  min-width: 190px;
  max-width: 240px;
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: opacity 0.15s, transform 0.15s;
}
.pet-card-bubble:active {
  opacity: 0.8;
  transform: scale(0.98);
}
.message-item.mine .pet-card-bubble {
  background: #fffbeb;
  border-color: #fde68a;
}
.pet-card-img { border-radius: 8px; flex-shrink: 0; }
.pet-card-info { flex: 1; min-width: 0; }
.pet-card-label {
  font-size: 10px;
  color: #f59e0b;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 3px;
}
.pet-card-name { font-size: 14px; font-weight: 800; color: var(--dark-charcoal); }
.pet-card-sub { font-size: 12px; color: #999; margin-top: 2px; }
.pet-card-desc {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
.time { 
  font-size: 11px; 
  color: var(--text-secondary); 
  margin-bottom: 4px; 
}
.msg-status {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary-yellow, #eab308);
}
.msg-status.read {
  color: #b0b0b0;
}
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
  padding: 6px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.composer-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 0 4px;
  border-bottom: 1px solid #f5f5f5;
}
.toolbar-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  color: #aaa;
  transition: color 0.15s, background 0.15s;
}
.toolbar-icon :deep(.el-icon) { font-size: 18px; width: 18px; height: 18px; }
.toolbar-icon :deep(svg) { width: 18px; height: 18px; }
.toolbar-icon:hover { color: var(--primary-yellow); background: #fff7e0; }
.toolbar-icon.disabled { color: #ddd; cursor: not-allowed; }
.toolbar-icon.disabled:hover { background: transparent; color: #ddd; }
.image-preview-wrap {
  position: relative;
  display: inline-block;
}
.image-preview-thumb {
  max-width: 120px;
  max-height: 80px;
  border-radius: 8px;
  display: block;
  object-fit: cover;
  border: 1px solid #e0e0e0;
}
.image-remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  min-height: 20px;
  padding: 0;
  background: rgba(0,0,0,0.45);
  border: none;
  color: #fff;
}
.composer-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.chat-input :deep(.el-input__count) {
  top: 0;
  bottom: 0;
  right: 10px;
  display: flex;
  align-items: center;
  background: transparent;
}
.chat-input :deep(.el-textarea .el-input__count) {
  top: 0;
  bottom: 0;
  right: 10px;
  display: flex;
  align-items: center;
  background: transparent;
}
.send-btn {
  background: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
  height: 36px;
  flex-shrink: 0;
}
.bubble-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  display: block;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-bottom: 2px;
}
.bubble-image:hover { opacity: 0.88; }
.empty-chat {
  margin: auto;
  color: var(--text-secondary);
  font-weight: 800;
}

/* 搜索好友弹窗样式 */
:deep(.search-friend-dialog) {
  border-radius: 20px;
}
:deep(.search-friend-dialog .el-dialog__header) {
  padding-bottom: 10px;
  border-bottom: 1px solid #f8f8f8;
}
:deep(.search-friend-dialog .el-dialog__title) {
  font-weight: 900;
  color: var(--dark-charcoal);
}
.search-container {
  padding: 4px 0;
}
.search-type-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.type-tab {
  padding: 8px 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}
.type-tab:hover {
  color: var(--primary-yellow);
}
.type-tab.active {
  color: var(--dark-charcoal);
}
.type-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary-yellow);
  border-radius: 4px;
}
.search-input-box {
  margin-bottom: 20px;
}
.search-input-box :deep(.el-input-group__append) {
  background-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
  border-color: var(--primary-yellow);
}
.search-results {
  max-height: 360px;
  min-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}
.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  transition: background 0.2s;
}
.result-item:hover {
  background: #f9f9f9;
}
.user-info {
  flex: 1;
  min-width: 0;
}
.user-info .username {
  font-size: 15px;
  font-weight: 800;
  color: var(--dark-charcoal);
}
.user-info .user-code {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
.add-btn {
  background: var(--primary-yellow);
  border-color: var(--primary-yellow);
  color: var(--dark-charcoal);
  font-weight: 800;
  border-radius: 8px;
}
.search-empty {
  padding: 20px 0;
}

@media (max-width: 960px) {

  .chat-layout { grid-template-columns: 1fr; }
  .chat-panel { min-height: 520px; }
}
</style>

