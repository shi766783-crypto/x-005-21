<script setup lang="ts">
import { useAchievementStore } from '../stores/useAchievementStore'
import { formatDate } from '../utils/format'

const store = useAchievementStore()
</script>

<template>
  <div class="achievement-grid">
    <div
      v-for="a in store.list.value"
      :key="a.code"
      class="badge"
      :class="{ locked: !a.unlocked }"
    >
      <div class="badge-icon">
        <el-icon size="26"><component :is="a.icon" /></el-icon>
      </div>
      <div class="badge-name">{{ a.name }}</div>
      <div class="badge-desc">{{ a.description }}</div>
      <div v-if="a.unlocked && a.unlockedAt" class="badge-date">{{ formatDate(a.unlockedAt) }} 解锁</div>
      <div v-else class="badge-date locked-text">未解锁</div>
    </div>
  </div>
</template>

<style scoped>
.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.badge {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 12px;
  text-align: center;
  background: #fff;
}
.badge-icon {
  color: #e6a23c;
  margin-bottom: 6px;
}
.badge.locked .badge-icon {
  color: #c0c4cc;
  filter: grayscale(1);
  opacity: 0.5;
}
.badge-name {
  font-weight: 600;
  font-size: 14px;
}
.badge-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 4px 0;
  min-height: 32px;
}
.badge-date {
  font-size: 11px;
  color: var(--success);
}
.locked-text {
  color: #c0c4cc;
}
</style>
