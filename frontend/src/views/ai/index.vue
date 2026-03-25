<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { Promotion } from '@element-plus/icons-vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { aiApi } from '../../services/api';

const renderMd = (t: string) => t ? DOMPurify.sanitize(marked.parse(t) as string) : '';

const userInput = ref('');
const loading = ref(false);
const messageBox = ref<HTMLElement | null>(null);
const conversationId = ref<string | undefined>(undefined);
const messages = ref([{ role: 'ai', content: '你好！我是你的 AI 宠物助手。今天我能为你和你的毛孩子做些什么？' }]);
const suggestions = ref(['狗狗肠胃问题', '猫咪不吃东西', '如厕训练技巧', '幼猫疫苗时间表']);

const scrollToBottom = async () => {
  await nextTick();
  if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight;
};

const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value) return;
  const msg = userInput.value;
  messages.value.push({ role: 'user', content: msg });
  userInput.value = '';
  loading.value = true;
  scrollToBottom();
  try {
    const res = await aiApi.sendMessage(msg, conversationId.value);
    conversationId.value = res.data.conversation_id;
    messages.value.push({ role: 'ai', content: res.data.response });
  } catch {
    messages.value.push({ role: 'ai', content: '抱歉，连接 AI 助手时出现问题，请稍后再试。' });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};
</script>

<template>
  <div class="ai-container">
    <div class="chat-wrapper">
      <div class="chat-messages" ref="messageBox">
        <div v-for="(msg, i) in messages" :key="i" class="message-row" :class="msg.role">
          <div v-if="msg.role === 'ai'" class="msg-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16.01" />
              <line x1="16" y1="16" x2="16" y2="16.01" />
            </svg>
          </div>
          <div class="message-bubble">
            <div v-if="msg.role === 'ai'" class="content markdown-body" v-html="renderMd(msg.content)"></div>
            <div v-else class="content">{{ msg.content }}</div>
          </div>
        </div>
        <div v-if="loading" class="message-row ai">
          <div class="msg-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
            </svg>
          </div>
          <div class="message-bubble typing">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>
      <div class="suggestions-scroll">
        <div
          v-for="tag in suggestions"
          :key="tag"
          class="suggestion-pill"
          @click="userInput = tag; sendMessage()"
        >
          {{ tag }}
        </div>
      </div>
      <div class="chat-input-area">
        <div class="input-wrapper">
          <input
            v-model="userInput"
            type="text"
            placeholder="问我任何关于宠物的问题..."
            @keyup.enter="sendMessage"
            :disabled="loading"
          />
          <button class="send-btn" @click="sendMessage" :disabled="loading || !userInput.trim()">
            <el-icon><Promotion /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-container {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 40px;
  height: calc(100vh - 120px);
}

.chat-wrapper {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: var(--bg-color);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.message-row {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-yellow);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.msg-avatar svg {
  width: 24px;
  height: 24px;
}

.message-bubble {
  padding: 16px 20px;
  border-radius: var(--border-radius-lg);
  font-size: 16px;
  line-height: 1.5;
}

.ai .message-bubble {
  background-color: #fff;
  color: var(--dark-charcoal);
  border-top-left-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.user .message-bubble {
  background-color: var(--dark-charcoal);
  color: #fff;
  border-top-right-radius: 4px;
}

:deep(.markdown-body p) {
  margin: 0 0 12px;
}

:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-body strong) {
  font-weight: 800;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  padding-left: 20px;
  margin-bottom: 12px;
}

.suggestions-scroll {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  overflow-x: auto;
  background-color: #fff;
  border-top: 2px dashed #f0f0f0;
}

.suggestions-scroll::-webkit-scrollbar {
  display: none;
}

.suggestion-pill {
  white-space: nowrap;
  padding: 10px 20px;
  background-color: var(--bg-color);
  border-radius: var(--border-radius-pill);
  font-size: 14px;
  font-weight: 700;
  color: var(--dark-charcoal);
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-pill:hover {
  background-color: var(--primary-yellow);
}

.chat-input-area {
  padding: 20px 24px;
  background-color: #fff;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: var(--bg-color);
  border-radius: var(--border-radius-pill);
  padding: 8px 8px 8px 24px;
}

.input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 16px;
  color: var(--dark-charcoal);
  outline: none;
}

.input-wrapper input::placeholder {
  color: var(--text-secondary);
}

.send-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-yellow);
  border: none;
  color: var(--dark-charcoal);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.send-btn:not(:disabled):hover {
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.typing {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 20px !important;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: var(--text-secondary);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@media (max-width: 768px) {
  .ai-container {
    height: calc(100vh - 160px);
    padding-bottom: 0;
  }

  .chat-messages {
    padding: 16px;
  }

  .message-row {
    max-width: 95%;
  }

  .message-bubble {
    padding: 12px 16px;
    font-size: 15px;
  }

  .chat-input-area {
    padding: 12px 16px;
  }

  .send-btn {
    width: 40px;
    height: 40px;
  }
}
</style>
