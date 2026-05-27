import { ref } from 'vue';
import { socialApi } from '@/api/index';

export const unreadTotal = ref(0);
export const globalFriends = ref<any[] | null>(null);
export const globalRequests = ref<any[] | null>(null);
export const globalMessageCache = ref<Record<number, any[]>>({});
export const globalMessageHasMore = ref<Record<number, boolean>>({});
export const globalMessagePage = ref<Record<number, number>>({});
let timer: number | null = null;

export const fetchUnreadSummary = async () => {
  if (!localStorage.getItem('token')) return;
  try {
    const res = await socialApi.getUnreadSummary();
    unreadTotal.value = res.data.unread_count + res.data.pending_count;
  } catch {}
};

export const preloadChatData = async () => {
  if (!localStorage.getItem('token')) return;
  try {
    const [friendsRes, reqsRes] = await Promise.all([
      socialApi.getFriends(),
      socialApi.getPendingRequests()
    ]);
    globalFriends.value = (friendsRes.data || []).map((item: any) => ({
      ...item,
      unread_count: Number(item.unread_count || 0),
    }));
    globalRequests.value = reqsRes.data || [];
  } catch {}
};

export const startUnreadPolling = () => {
  if (timer) return;
  fetchUnreadSummary();
  preloadChatData(); // 预加载列表数据
  timer = window.setInterval(() => {
    fetchUnreadSummary();
  }, 15000);
};

export const stopUnreadPolling = () => {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
};
