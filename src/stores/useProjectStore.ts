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
  type PredecessorState,
} from '../types'
import { useLocalStorage } from '../utils/storage'
import { uid } from '../utils/id'
import { toNumber, isCurrentMonth } from '../utils/format'
import { useToolStore } from './useToolStore'
import { useMaterialStore } from './useMaterialStore'
import { useBorrowStore } from './useBorrowStore'

// 模块级单例状态
const projects = useLocalStorage<Project[]>('diy.projects', [])

// 旧数据迁移：早期版本没有 predecessorIds 字段，读取后补全并清理已删除项目的悬挂引用
{
  let changed = false
  for (const p of projects.value) {
    if (!Array.isArray(p.predecessorIds)) {
      p.predecessorIds = []
      changed = true
    }
  }
  const idSet = new Set(projects.value.map((p) => p.id))
  for (const p of projects.value) {
    const cleaned = p.predecessorIds.filter((pid) => idSet.has(pid))
    if (cleaned.length !== p.predecessorIds.length) {
      p.predecessorIds = cleaned
      changed = true
    }
  }
  if (changed) {
    // 触发 localStorage 持久化（直接改动在 watch 首次建立前可能未被捕获）
    projects.value = [...projects.value]
  }
}

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
    const project: Project = {
      ...data,
      predecessorIds: data.predecessorIds ?? [],
      id: uid('proj_'),
      createdAt: now,
      updatedAt: now,
    }
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

  /**
   * 删除项目：同步解除其他项目对它的前置依赖。
   * 调用方应先用 dependentsOf 检查受影响的下游项目并提醒用户确认。
   */
  function removeProject(id: string) {
    projects.value = projects.value.filter((p) => p.id !== id)
    for (const p of projects.value) {
      if (p.predecessorIds.includes(id)) {
        p.predecessorIds = p.predecessorIds.filter((pid) => pid !== id)
      }
    }
  }

  function getProject(id: string): Project | undefined {
    return projects.value.find((p) => p.id === id)
  }

  // ---------- 前置依赖 ----------

  /** 直接依赖某项目的下游项目（把 id 作为前置的项目） */
  function dependentsOf(id: string): Project[] {
    return projects.value.filter((p) => p.predecessorIds.includes(id))
  }

  /** 项目的前置项目对象列表（自动跳过已不存在的悬挂 id） */
  function predecessorProjects(project: Project): Project[] {
    return project.predecessorIds
      .map((pid) => getProject(pid))
      .filter((p): p is Project => !!p)
  }

  /** 前置项目的状态明细，用于页面展示与「前置未完成」提示 */
  function predecessorStates(project: Project): PredecessorState[] {
    return predecessorProjects(project).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      done: p.status === '已完成',
    }))
  }

  /** 是否仍有前置项目未完成（悬挂引用视为已解除，不阻塞） */
  function hasUnfinishedPredecessor(project: Project): boolean {
    return predecessorStates(project).some((s) => !s.done)
  }

  /** 未完成的前置项目状态明细 */
  function unfinishedPredecessors(project: Project): PredecessorState[] {
    return predecessorStates(project).filter((s) => !s.done)
  }

  /**
   * 校验一组候选前置 id：去重、过滤自身/不存在的项目、过滤会导致循环的依赖。
   * 构造临时图（把 projectId 的前置整体替换为候选集），沿「前置」方向
   * 从 projectId 出发做 DFS：能回到自身即存在环，环上的候选项目会被拒绝。
   */
  function validatePredecessors(
    projectId: string | undefined,
    candidateIds: string[],
  ): { validIds: string[]; rejected: Project[] } {
    const unique = [...new Set(candidateIds)].filter((pid) => pid !== projectId && !!getProject(pid))
    if (!projectId) return { validIds: unique, rejected: [] }

    // 环上的候选项目 id：DFS 中若某候选可达 projectId，或候选内部互相成环
    const cyclic = new Set<string>()
    for (const start of unique) {
      const seen = new Set<string>()
      const stack = [start]
      while (stack.length) {
        const cur = stack.pop() as string
        if (cur === projectId || (cur !== start && unique.includes(cur))) {
          cyclic.add(start)
          break
        }
        if (seen.has(cur)) continue
        seen.add(cur)
        const curProject = getProject(cur)
        if (curProject) stack.push(...curProject.predecessorIds)
      }
    }

    const rejected = unique.filter((pid) => cyclic.has(pid)).map((pid) => getProject(pid) as Project)
    return { validIds: unique.filter((pid) => !cyclic.has(pid)), rejected }
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

  /**
   * 被阻塞/需关注的项目：有前置未完成的非搁置项目。
   * 每项附带未完成的前置明细，供首页提醒面板使用。
   */
  const blockedProjects = computed(() =>
    projects.value
      .filter((p) => p.status !== '已搁置')
      .map((p) => ({ project: p, blockers: unfinishedPredecessors(p) }))
      .filter((x) => x.blockers.length > 0),
  )

  return {
    projects,
    addProject,
    updateProject,
    removeProject,
    getProject,
    computeGap,
    dependentsOf,
    predecessorProjects,
    predecessorStates,
    hasUnfinishedPredecessor,
    unfinishedPredecessors,
    validatePredecessors,
    completedProjects,
    inProgressProjects,
    completedThisMonth,
    diyScore,
    blockedProjects,
  }
}
