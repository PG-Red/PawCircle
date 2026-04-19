<template>
  <div class="privacy-panel">
    <div class="privacy-intro">
      <span class="privacy-kicker">{{ kicker }}</span>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  kicker: string;
  title: string;
  description: string;
}>();
</script>

<style scoped>
.privacy-panel {
  display: grid;
  gap: 14px;
}

.privacy-intro {
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(255, 244, 217, 0.72) 100%);
  border: 1px solid rgba(251, 191, 36, 0.18);
}

.privacy-kicker {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 0.12em;
  font-weight: 800;
  color: #b7791f;
  margin-bottom: 8px;
}

.privacy-intro h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 900;
  color: var(--dark-charcoal);
}

.privacy-intro p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(58, 45, 26, 0.72);
}
</style>