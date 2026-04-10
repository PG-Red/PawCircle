<template>
  <Teleport to="body">
    <Transition name="confirm-dialog-fade">
      <div v-if="modelValue" class="confirm-overlay" @click.self="emit('update:modelValue', false)">
        <div class="confirm-dialog" role="dialog" aria-modal="true">
          <!-- 图标区（可通过插槽替换） -->
          <div class="confirm-icon-wrap">
            <slot name="icon">
              <span>{{ defaultIcon }}</span>
            </slot>
          </div>

          <!-- 标题（可通过插槽或 prop 替换） -->
          <h3 class="confirm-title">
            <slot name="title">{{ title }}</slot>
          </h3>

          <!-- 描述（可通过插槽或 prop 替换） -->
          <p class="confirm-desc">
            <slot name="description">{{ description }}</slot>
          </p>

          <!-- 操作按钮 -->
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="emit('update:modelValue', false)">
              <slot name="cancel-text">{{ cancelText }}</slot>
            </button>
            <button class="confirm-btn ok" :class="okType" @click="handleConfirm">
              <slot name="ok-text">{{ okText }}</slot>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean;
  title?: string;
  description?: string;
  okText?: string;
  cancelText?: string;
  /** 'danger' | 'primary' — 控制确认按钮的配色 */
  okType?: 'danger' | 'primary';
  defaultIcon?: string;
}>(), {
  title: '确认操作',
  description: '此操作无法撤销，是否继续？',
  okText: '确认',
  cancelText: '取消',
  okType: 'danger',
  defaultIcon: '🐾',
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirm'): void;
}>();

const handleConfirm = () => {
  emit('confirm');
  emit('update:modelValue', false);
};
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.confirm-dialog {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 36px 32px 28px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confirm-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary-yellow);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 28px;
  flex-shrink: 0;
}

.confirm-title {
  font-size: 20px;
  font-weight: 900;
  color: var(--dark-charcoal);
  margin: 0 0 10px;
  letter-spacing: -0.3px;
}

.confirm-desc {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 28px;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.confirm-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: var(--border-radius-pill);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.18s;
  font-family: inherit;
}

.confirm-btn.cancel {
  background: #f5f5f5;
  color: var(--text-secondary);
}

.confirm-btn.cancel:hover {
  background: #ebebeb;
  color: var(--dark-charcoal);
}

.confirm-btn.ok.danger {
  background: var(--dark-charcoal);
  color: #fff;
}

.confirm-btn.ok.danger:hover {
  background: #ff4d4f;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 77, 79, 0.35);
}

.confirm-btn.ok.primary {
  background: var(--primary-yellow);
  color: var(--dark-charcoal);
}

.confirm-btn.ok.primary:hover {
  background: #e5b800;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(252, 211, 113, 0.5);
}

/* 弹窗动画 */
.confirm-dialog-fade-enter-active,
.confirm-dialog-fade-leave-active {
  transition: opacity 0.22s ease;
}
.confirm-dialog-fade-enter-active .confirm-dialog,
.confirm-dialog-fade-leave-active .confirm-dialog {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease;
}
.confirm-dialog-fade-enter-from,
.confirm-dialog-fade-leave-to {
  opacity: 0;
}
.confirm-dialog-fade-enter-from .confirm-dialog {
  transform: scale(0.88) translateY(16px);
  opacity: 0;
}
.confirm-dialog-fade-leave-to .confirm-dialog {
  transform: scale(0.92);
  opacity: 0;
}
</style>

