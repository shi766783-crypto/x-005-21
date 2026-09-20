import { computed } from 'vue'
import type { Tool } from '../types'
import { useLocalStorage } from '../utils/storage'
import { uid } from '../utils/id'
import { toNumber } from '../utils/format'

// 模块级单例状态：整个应用共享同一份工具库存
const tools = useLocalStorage<Tool[]>('diy.tools', [])

export function useToolStore() {
  function addTool(data: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): Tool {
    const now = Date.now()
    const tool: Tool = { ...data, id: uid('tool_'), createdAt: now, updatedAt: now }
    tools.value.push(tool)
    return tool
  }

  function updateTool(id: string, patch: Partial<Omit<Tool, 'id' | 'createdAt'>>) {
    const tool = tools.value.find((t) => t.id === id)
    if (tool) Object.assign(tool, patch, { updatedAt: Date.now() })
  }

  function removeTool(id: string) {
    tools.value = tools.value.filter((t) => t.id !== id)
  }

  function getTool(id: string): Tool | undefined {
    return tools.value.find((t) => t.id === id)
  }

  /** 工具总数：按数量累加（如 3 把螺丝刀算 3 件） */
  const totalQuantity = computed(() => tools.value.reduce((s, t) => s + toNumber(t.quantity), 0))

  /** 完好工具数量（按数量加权） */
  const intactQuantity = computed(() =>
    tools.value.filter((t) => t.status === '完好').reduce((s, t) => s + toNumber(t.quantity), 0),
  )

  /** 工具完好率 = 完好数量 / 总数量（无工具时视为 0） */
  const intactRate = computed(() =>
    totalQuantity.value > 0 ? intactQuantity.value / totalQuantity.value : 0,
  )

  return { tools, addTool, updateTool, removeTool, getTool, totalQuantity, intactQuantity, intactRate }
}
