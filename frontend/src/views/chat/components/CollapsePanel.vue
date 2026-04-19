<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue';

const props = withDefaults(defineProps<{
  title: string;
  modelValue?: boolean;
  collapsible?: boolean;
}>(), {
  modelValue: true,
  collapsible: true
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const toggle = () => {
  if (!props.collapsible) return;
  emit('update:modelValue', !props.modelValue);
};
</script>

<template>
  <div class="panel-section">
    <div class="panel-header" :class="{ static: !collapsible }" @click="toggle">
      <div class="panel-title">{{ title }}</div>
      <el-icon v-if="collapsible" :class="{ expanded: modelValue }"><ArrowRight /></el-icon>
    </div>
    <el-collapse-transition v-if="collapsible">
      <div v-show="modelValue">
        <slot></slot>
      </div>
    </el-collapse-transition>
    <div v-else>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.panel-section {
  margin-bottom: 16px;
}
.panel-section:last-child {
  margin-bottom: 0;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 4px;
  margin-bottom: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.panel-header:hover:not(.static) {
  background-color: var(--bg-color);
}
.panel-header.static {
  cursor: default;
}
.panel-title {
  font-size: 15px;
  font-weight: 900;
  color: var(--dark-charcoal);
  margin: 0;
}
.panel-header .el-icon {
  font-size: 14px;
  color: var(--text-secondary);
  transition: transform 0.3s;
}
.panel-header .el-icon.expanded {
  transform: rotate(90deg);
}
</style>
