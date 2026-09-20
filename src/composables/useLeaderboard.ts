import { computed } from 'vue'
import { useToolStore } from '../stores/useToolStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useBorrowStore } from '../stores/useBorrowStore'

interface Tier {
  min: number
  name: string
}

/** DIY 达人段位（按加权分数） */
const DIY_TIERS: Tier[] = [
  { min: 30, name: '传说大师' },
  { min: 20, name: '钻石达人' },
  { min: 12, name: '黄金达人' },
  { min: 6, name: '白银达人' },
  { min: 2, name: '青铜达人' },
  { min: 0, name: '新手起步' },
]

/** 工具管理大师段位（按 0-100 综合分） */
const MASTER_TIERS: Tier[] = [
  { min: 95, name: '工具大师' },
  { min: 85, name: '资深管家' },
  { min: 70, name: '称职管家' },
  { min: 50, name: '见习管家' },
  { min: 0, name: '新手管家' },
]

function tierOf(score: number, tiers: Tier[]): string {
  return tiers.find((t) => score >= t.min)?.name ?? tiers[tiers.length - 1].name
}

function nextTier(score: number, tiers: Tier[]): Tier | null {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (score < tiers[i].min) return tiers[i]
  }
  return null
}

/**
 * 排行榜派生数据。
 * 单用户本地应用，故以「个人分数 + 段位」的形式呈现两类榜单，
 * 分数公式在此集中维护，保证口径统一。
 */
export function useLeaderboard() {
  const toolStore = useToolStore()
  const projectStore = useProjectStore()
  const borrowStore = useBorrowStore()

  // DIY 达人榜：按完成项目数及难度加权
  const diyScore = computed(() => projectStore.diyScore.value)
  const diyCompletedCount = computed(() => projectStore.completedProjects.value.length)

  // 工具管理大师榜：工具完好率 60% + 借还准时率 40%
  const toolMasterScore = computed(() => {
    const rate = toolStore.intactRate.value * 0.6 + borrowStore.punctualityRate.value * 0.4
    return Math.round(rate * 100)
  })

  const toolIntactRate = computed(() => Math.round(toolStore.intactRate.value * 100))
  const borrowPunctualityRate = computed(() => Math.round(borrowStore.punctualityRate.value * 100))

  return {
    diyScore,
    diyCompletedCount,
    diyTier: computed(() => tierOf(diyScore.value, DIY_TIERS)),
    diyNextTier: computed(() => nextTier(diyScore.value, DIY_TIERS)),
    toolMasterScore,
    toolMasterTier: computed(() => tierOf(toolMasterScore.value, MASTER_TIERS)),
    toolMasterNextTier: computed(() => nextTier(toolMasterScore.value, MASTER_TIERS)),
    toolIntactRate,
    borrowPunctualityRate,
  }
}
