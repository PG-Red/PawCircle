<template>
  <div class="ai-assistant-container">
    <div class="chat-wrapper">
      <div class="chat-messages" ref="messageBox">
        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          class="message-row"
          :class="msg.role"
        >
          <div v-if="msg.role === 'ai'" class="msg-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16.01" />
              <line x1="16" y1="16" x2="16" y2="16.01" />
            </svg>
          </div>
          <div class="message-bubble">
            <div v-if="msg.role === 'ai'" class="content markdown-body" v-html="renderMarkdown(msg.content)"></div>
            <div v-else class="content">{{ msg.content }}</div>
          </div>
        </div>
        <div v-if="loading" class="message-row ai">
          <div class="msg-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16.01" />
              <line x1="16" y1="16" x2="16" y2="16.01" />
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

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { Promotion } from '@element-plus/icons-vue';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const renderMarkdown = (text: string) => {
  if (!text) return '';
  const rawHtml = marked.parse(text) as string;
  return DOMPurify.sanitize(rawHtml);
};

const userInput = ref('');
const loading = ref(false);
const messageBox = ref<HTMLElement | null>(null);
const messages = ref([
  { role: 'ai', content: '你好！我是你的 AI 宠物助手。今天我能为你和你的毛孩子做些什么？' }
]);

const suggestions = ref([
  '狗狗肠胃问题', 
  '猫咪不吃东西', 
  '如厕训练技巧', 
  '幼猫疫苗时间表'
]);

const scrollToBottom = async () => {
  await nextTick();
  if (messageBox.value) {
    messageBox.value.scrollTop = messageBox.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || loading.value) return;

  const userMsg = userInput.value;
  messages.value.push({ role: 'user', content: userMsg });
  userInput.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMsg,
      config: {
        systemInstruction: "你是一名专业的宠物专家，负责回答用户关于宠物护理、健康、行为训练等问题。你的回答应该专业、友好且易于理解。",
      }
    });

    messages.value.push({ role: 'ai', content: response.text || '抱歉，我现在无法回答这个问题。' });
  } catch (error) {
    console.error('AI Error:', error);
    messages.value.push({ role: 'ai', content: '抱歉，连接 AI 助手时出现问题，请稍后再试。' });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};
</script>

<style scoped>
.ai-assistant-container {
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

.chat-header {
  padding: 24px;
  border-bottom: 2px dashed #F0F0F0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ai-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary-yellow);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dark-charcoal);
  flex-shrink: 0;
}

.ai-avatar svg {
  width: 32px;
  height: 32px;
}

.header-info h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--dark-charcoal);
}

.header-info p {
  margin: 0;
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 600;
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
  color: var(--dark-charcoal);
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
  font-weight: 600;
}

.ai .message-bubble {
  background-color: #fff;
  color: var(--dark-charcoal);
  border-top-left-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.user .message-bubble {
  background-color: var(--dark-charcoal);
  color: #fff;
  border-top-right-radius: 4px;
}

:deep(.markdown-body p) {
  margin-top: 0;
  margin-bottom: 12px;
}
:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}
:deep(.markdown-body strong) {
  font-weight: 800;
}
:deep(.markdown-body ul), :deep(.markdown-body ol) {
  padding-left: 20px;
  margin-bottom: 12px;
}
:deep(.markdown-body li) {
  margin-bottom: 4px;
}
:deep(.markdown-body h1), :deep(.markdown-body h2), :deep(.markdown-body h3) {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 800;
}
:deep(.markdown-body code) {
  background-color: rgba(0,0,0,0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}
:deep(.markdown-body pre) {
  background-color: rgba(0,0,0,0.05);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 12px;
}
:deep(.markdown-body pre code) {
  background-color: transparent;
  padding: 0;
}

.suggestions-scroll {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  overflow-x: auto;
  background-color: #fff;
  border-top: 2px dashed #F0F0F0;
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
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 600;
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

/* Typing animation */
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

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@media (max-width: 768px) {
  .ai-assistant-container {
    height: calc(100vh - 160px);
    padding-bottom: 0;
  }
  .chat-header {
    padding: 16px;
  }
  .header-info h2 {
    font-size: 20px;
  }
  .ai-avatar {
    width: 48px;
    height: 48px;
  }
  .ai-avatar svg {
    width: 28px;
    height: 28px;
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
    font-size: 18px;
  }
  .input-wrapper input {
    font-size: 15px;
  }
}
</style>
