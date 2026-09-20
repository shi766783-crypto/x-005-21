import { computed, watch } from 'vue'
import type { AchievementDef } from '../types'
import { useLocalStorage } from '../utils/storage'
import { useToolStore } from './useToolStore'
import { useMaterialStore } from './useMaterialStore'
import { useProjectStore } from './useProjectStore'
import { useBorrowStore } from './useBorrowStore'
import { isOnOrBefore } from '../utils/format'

/** 成就定义：code -> 达成条件在 conditions 中集中维护 */
export const ACHIEVEMENTS: AchievementDef[] = [
  { code: 'first_project', name: '初次动手', description: '创建第一个 DIY 项目', icon: 'Flag' },
  { code: 'planning_3', name: '规划达人', description: '累计创建 3 个项目', icon: 'Notebook' },
  { code: 'completed_1', name: '初战告捷', description: '完成第 1 个项目', icon: 'Medal' },
  { code: 'completed_5', name: '项目大师', description: '累计完成 5 个项目', icon: 'Trophy' },
  { code: 'completed_10', name: '成就巅峰', description: '累计完成 10 个项目', icon: 'Top' },
  { code: 'tools_10', name: '工具收藏家', description: '拥有 10 件以上工具', icon: 'Suitcase' },
  { code: 'tools_ready', name: '工具齐全', description: '有一个项目所需工具零缺口', icon: 'Tools' },
  { code: 'materials_10', name: '材料管家', description: '拥有 10 种以上材料', icon: 'Box' },
  { code: 'materials_ready', name: '材料无忧', description: '有一个项目所需材料零缺口', icon: 'Goods' },
  { code: 'zero_waste', name: '零浪费', description: '完成项目且反馈材料未浪费', icon: 'CircleCheck' },
  { code: 'punctual', name: '准时之星', description: '有一次按时归还记录', icon: 'Clock' },
  { code: 'reflector', name: '反思者', description: '完成项目并撰写完整总结', icon: 'EditPen' },
]

// 已解锁成就：code -> 解锁时间戳
const unlocked = useLocalStorage<Record<string, number>>('diy.achievements', {})

export function useAchievementStore() {
  const toolStore = useToolStore()
  const materialStore = useMaterialStore()
  const projectStore = useProjectStore()
  const borrowStore = useBorrowStore()

  /** 判断单个成就是否已达成（纯函数，便于测试与复用） */
  function isAchieved(code: string): boolean {
    const projects = projectStore.projects.value
    const completed = projectStore.completedProjects.value

    switch (code) {
      case 'first_project':
        return projects.length >= 1
      case 'planning_3':
        return projects.length >= 3
      case 'completed_1':
        return completed.length >= 1
      case 'completed_5':
        return completed.length >= 5
      case 'completed_10':
        return completed.length >= 10
      case 'tools_10':
        return toolStore.totalQuantity.value >= 10
      case 'tools_ready':
        return projects.some(
          (p) => p.tools.length > 0 && projectStore.computeGap(p).tools.length === 0,
        )
      case 'materials_10':
        return materialStore.materials.value.length >= 10
      case 'materials_ready':
        return projects.some(
          (p) => p.materials.length > 0 && projectStore.computeGap(p).materials.length === 0,
        )
      case 'zero_waste':
        return completed.some((p) => p.feedback?.materialWaste === false)
      case 'punctual':
        return borrowStore.returned.value.some((r) =>
          isOnOrBefore(r.actualReturnDate!, r.expectedReturnDate),
        )
      case 'reflector':
        return completed.some((p) => {
          const s = p.summary
          return !!s && !!s.gains.trim() && !!s.problems.trim() && !!s.improvements.trim()
        })
      default:
        return false
    }
  }

  /** 扫描所有成就，自动解锁新达成的成就 */
  function checkAndUnlock() {
    let changed = false
    for (const a of ACHIEVEMENTS) {
      if (!unlocked.value[a.code] && isAchieved(a.code)) {
        unlocked.value[a.code] = Date.now()
        changed = true
      }
    }
    return changed
  }

  // 数据变化时自动解锁（immediate 用于应用启动时补齐历史已达成但未记录的成就）
  watch(
    [
      () => projectStore.projects.value,
      () => toolStore.tools.value,
      () => materialStore.materials.value,
      () => borrowStore.records.value,
    ],
    checkAndUnlock,
    { deep: true, immediate: true },
  )

  const list = computed(() =>
    ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: !!unlocked.value[a.code],
      unlockedAt: unlocked.value[a.code] ?? null,
    })),
  )

  const unlockedCount = computed(() => list.value.filter((a) => a.unlocked).length)
  const totalCount = ACHIEVEMENTS.length

  return { list, unlockedCount, totalCount, checkAndUnlock }
}
