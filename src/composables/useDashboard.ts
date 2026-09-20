import { computed } from 'vue'
import { useToolStore } from '../stores/useToolStore'
import { useMaterialStore } from '../stores/useMaterialStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useBorrowStore } from '../stores/useBorrowStore'

/**
 * 数据看板派生数据：聚合各 store，提供首页与看板页所需的统计指标。
 * 纯派生逻辑，不写数据，与视图解耦。
 */
export function useDashboard() {
  const toolStore = useToolStore()
  const materialStore = useMaterialStore()
  const projectStore = useProjectStore()
  const borrowStore = useBorrowStore()

  const stats = computed(() => ({
    toolTotal: toolStore.totalQuantity.value,
    materialKinds: materialStore.categoryCount.value,
    inProgress: projectStore.inProgressProjects.value.length,
    completedThisMonth: projectStore.completedThisMonth.value,
    lowStock: materialStore.lowStockMaterials.value.length,
  }))

  /** 首页未归还工具提醒 */
  const unreturnedBorrows = computed(() => borrowStore.unreturned.value)

  /** 首页库存预警提醒 */
  const lowStockMaterials = computed(() => materialStore.lowStockMaterials.value)

  return { stats, unreturnedBorrows, lowStockMaterials }
}
