<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  color?: string
  icon?: string
}>()
</script>

<template>
  <div class="stat-card card">
    <div class="stat-icon" :style="{ background: `${color}1a`, color }">
      <el-icon v-if="icon" size="22"><component :is="icon" /></el-icon>
    </div>
    <div>
      <div class="stat-value" :style="{ color }">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
