<template>
  <button
    type="button"
    class="privacy-option"
    :class="{ active: isActive, disabled: disabled }"
    @click="handleClick"
  >
    <div class="privacy-copy">
      <div class="privacy-title-row">
        <span class="privacy-badge">{{ badge }}</span>
        <h4>{{ title }}</h4>
      </div>
      <p>{{ description }}</p>
    </div>
    
    <el-switch
      v-if="type === 'switch'"
      :model-value="Boolean(modelValue)"
      @update:model-value="$emit('update:modelValue', $event)"
      class="privacy-switch"
      :disabled="disabled"
      @click.stop
    />
    
    <div 
      v-else-if="type === 'radio'"
      class="privacy-radio" 
      :class="{ selected: isActive }" 
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  badge: string;
  title: string;
  description: string;
  type?: 'switch' | 'radio';
  modelValue?: boolean | string | number;
  value?: string | number | boolean;
  disabled?: boolean;
}>(), {
  type: 'switch',
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const isActive = computed(() => {
  if (props.type === 'radio') {
    return props.modelValue === props.value;
  }
  return Boolean(props.modelValue);
});

const handleClick = () => {
  if (props.disabled) return;
  if (props.type === 'switch') {
    emit('update:modelValue', !props.modelValue);
  } else if (props.type === 'radio') {
    emit('update:modelValue', props.value);
  }
};
</script>

<style scoped>
.privacy-option {
  width: 100%;
  border: 1px solid rgba(224, 210, 180, 0.9);
  border-radius: 18px;
  background: rgba(255,255,255,0.82);
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.privacy-option:hover {
  transform: translateY(-1px);
  border-color: rgba(251, 191, 36, 0.45);
  box-shadow: 0 12px 24px rgba(242, 180, 27, 0.08);
}

.privacy-option.active {
  border-color: rgba(251, 191, 36, 0.65);
  box-shadow: 0 14px 28px rgba(242, 180, 27, 0.12);
}

.privacy-option.disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.privacy-copy {
  flex: 1;
}

.privacy-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.privacy-badge {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(251, 191, 36, 0.18);
  color: #8a5a11;
  font-size: 12px;
  font-weight: 900;
}

.privacy-copy h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: var(--dark-charcoal);
}

.privacy-copy p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.privacy-switch {
  align-self: center;
}

.privacy-radio {
  align-self: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(224, 210, 180, 0.9);
  background: rgba(255,255,255,0.82);
  transition: border-color 0.18s, background-color 0.18s, box-shadow 0.18s;
}

.privacy-radio.selected {
  border-color: #f2b41b;
  background: #f2b41b;
  box-shadow: 0 0 0 3px rgba(242, 180, 27, 0.2);
}

@media (max-width: 768px) {
  .privacy-option {
    padding: 16px;
    align-items: flex-start;
  }
}
</style>