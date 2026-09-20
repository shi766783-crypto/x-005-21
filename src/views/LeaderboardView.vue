<script setup lang="ts">
import { computed } from 'vue'
import { useLeaderboard } from '../composables/useLeaderboard'

const lb = useLeaderboard()

const diyProgress = computed(() => {
  const next = lb.diyNextTier.value
  if (!next) return 100
  return Math.min(100, Math.round((lb.diyScore.value / next.min) * 100))
})

const masterProgress = computed(() => {
  const next = lb.toolMasterNextTier.value
  if (!next) return 100
  return Math.min(100, Math.round((lb.toolMasterScore.value / next.min) * 100))
})
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">排行榜</h2>
      <span class="muted">单用户本地应用，以「个人分数 + 段位」呈现</span>
    </div>

    <div class="board-grid">
      <section class="card board">
        <div class="board-head">
          <el-icon size="30" color="#e6a23c"><Trophy /></el-icon>
          <div>
            <div class="board-title">DIY 达人榜</div>
            <div class="board-sub">按完成项目数及难度加权排序</div>
          </div>
        </div>
        <div class="rank-tag">{{ lb.diyTier.value }}</div>
        <div class="score">{{ lb.diyScore.value }} <span class="score-unit">分</span></div>
        <div class="board-meta">已完成 {{ lb.diyCompletedCount.value }} 个项目</div>
        <el-progress :percentage="diyProgress" :stroke-width="10" />
        <div class="board-tip">
          {{ lb.diyNextTier.value ? `距离「${lb.diyNextTier.value.name}」还需 ${lb.diyNextTier.value.min - lb.diyScore.value} 分` : '已达最高段位' }}
        </div>
        <div class="formula muted">计分：简单 +1 · 中等 +2 · 困难 +3</div>
      </section>

      <section class="card board">
        <div class="board-head">
          <el-icon size="30" color="#409eff"><Suitcase /></el-icon>
          <div>
            <div class="board-title">工具管理大师榜</div>
            <div class="board-sub">按工具完好率与借还准时率综合排序</div>
          </div>
        </div>
        <div class="rank-tag">{{ lb.toolMasterTier.value }}</div>
        <div class="score">{{ lb.toolMasterScore.value }} <span class="score-unit">分</span></div>
        <div class="board-meta">
          工具完好率 {{ lb.toolIntactRate.value }}% · 借还准时率 {{ lb.borrowPunctualityRate.value }}%
        </div>
        <el-progress :percentage="masterProgress" :stroke-width="10" />
        <div class="board-tip">
          {{ lb.toolMasterNextTier.value ? `距离「${lb.toolMasterNextTier.value.name}」还需 ${lb.toolMasterNextTier.value.min - lb.toolMasterScore.value} 分` : '已达最高段位' }}
        </div>
        <div class="formula muted">计分：完好率 × 60% + 准时率 × 40%</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.board-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 900px) {
  .board-grid {
    grid-template-columns: 1fr;
  }
}
.board {
  padding: 24px;
  text-align: center;
}
.board-head {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}
.board-title {
  font-size: 18px;
  font-weight: 700;
  text-align: left;
}
.board-sub {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: left;
}
.rank-tag {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  background: linear-gradient(90deg, #fdf6ec, #fef0e6);
  color: #e6a23c;
  font-weight: 700;
  margin-bottom: 12px;
}
.score {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
}
.score-unit {
  font-size: 16px;
  color: var(--text-secondary);
  font-weight: 400;
}
.board-meta {
  color: var(--text-secondary);
  margin-bottom: 16px;
}
.board-tip {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.formula {
  margin-top: 12px;
  font-size: 12px;
}
</style>
