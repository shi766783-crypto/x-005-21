import { computed } from 'vue'
import {
  DIFFICULTY_WEIGHT,
  type Project,
  type ProjectGap,
  type ToolGap,
  type MaterialGap,
  type Tool,
  type ProjectToolItem,
  type ProjectMaterialItem,
} from '../types'
import { useLocalStorage } from '../utils/storage'
import { uid } from '../utils/id'
import { toNumber, isCurrentMonth } from '../utils/format'
import { useToolStore } from './useToolStore'
import { useMaterialStore } from './useMaterialStore'
import { useBorrowStore } from './useBorrowStore'

// 模块级单例状态
const projects = useLocalStorage<Project[]>('diy.projects', [])

/**
 * 计算单个工具当前可投入项目的可用数量：
 * 仅「完好」状态可用的工具才计入，且需扣除当前被借出的数量。
 */
function toolAvailable(tool: Tool, borrowedByTool: Record<string, number>): number {
  if (tool.status !== '完好') return 0
  const borrowed = borrowedByTool[tool.id] ?? 0
  return Math.max(0, toNumber(tool.quantity) - borrowed)
}

export function useProjectStore() {
  const toolStore = useToolStore()
  const materialStore = useMaterialStore()
  const borrowStore = useBorrowStore()

  function addProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const now = Date.now()
    const project: Project = { ...data, id: uid('proj_'), createdAt: now, updatedAt: now }
    projects.value.push(project)
    return project
  }

  function updateProject(id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) {
    const project = projects.value.find((p) => p.id === id)
    if (project) {
      Object.assign(project, patch, { updatedAt: Date.now() })
      // 状态变为已完成时记录完成时间，供「本月完成项目数」统计
      if (patch.status === '已完成' && !project.completedAt) {
        project.completedAt = Date.now()
      }
      if (patch.status && patch.status !== '已完成') {
        project.completedAt = undefined
      }
    }
  }

  function removeProject(id: string) {
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  function getProject(id: string): Project | undefined {
    return projects.value.find((p) => p.id === id)
  }

  /** 项目缺口分析（核心计算属性逻辑）：对比库存，生成待采购/待借用清单 */
  function computeGap(project: Project): ProjectGap {
    const toolGaps: ToolGap[] = project.tools
      .map((item: ProjectToolItem) => {
        let available = 0
        if (item.source === 'library' && item.toolId) {
          const tool = toolStore.getTool(item.toolId)
          if (tool) available = toolAvailable(tool, borrowStore.borrowedByTool.value)
        }
        const required = toNumber(item.requiredQty)
        return {
          key: item.key,
          name: item.name,
          requiredQty: required,
          availableQty: available,
          missingQty: Math.max(0, required - available),
          source: item.source,
        }
      })
      .filter((g) => g.missingQty > 0)

    const materialGaps: MaterialGap[] = project.materials
      .map((item: ProjectMaterialItem) => {
        let available = 0
        if (item.source === 'library' && item.materialId) {
          const material = materialStore.getMaterial(item.materialId)
          if (material) available = toNumber(material.quantity)
        }
        const required = toNumber(item.requiredQty)
        return {
          key: item.key,
          name: item.name,
          requiredQty: required,
          availableQty: available,
          missingQty: Math.max(0, required - available),
          unit: item.unit,
          source: item.source,
        }
      })
      .filter((g) => g.missingQty > 0)

    return { tools: toolGaps, materials: materialGaps, hasGap: toolGaps.length > 0 || materialGaps.length > 0 }
  }

  /** 已完成项目 */
  const completedProjects = computed(() => projects.value.filter((p) => p.status === '已完成'))

  /** 进行中项目 */
  const inProgressProjects = computed(() => projects.value.filter((p) => p.status === '进行中'))

  /** 本月完成项目数 */
  const completedThisMonth = computed(() =>
    completedProjects.value.filter((p) => p.completedAt && isCurrentMonth(p.completedAt)).length,
  )

  /** DIY 达人分：已完成项目按难度加权求和 */
  const diyScore = computed(() =>
    completedProjects.value.reduce((s, p) => s + DIFFICULTY_WEIGHT[p.difficulty], 0),
  )

  return {
    projects,
    addProject,
    updateProject,
    removeProject,
    getProject,
    computeGap,
    completedProjects,
    inProgressProjects,
    completedThisMonth,
    diyScore,
  }
}
