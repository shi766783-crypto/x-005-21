import { computed } from 'vue'
import type { Material } from '../types'
import { useLocalStorage } from '../utils/storage'
import { uid } from '../utils/id'
import { toNumber } from '../utils/format'

// 模块级单例状态
const materials = useLocalStorage<Material[]>('diy.materials', [])

export function useMaterialStore() {
  function addMaterial(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Material {
    const now = Date.now()
    const material: Material = { ...data, id: uid('mat_'), createdAt: now, updatedAt: now }
    materials.value.push(material)
    return material
  }

  function updateMaterial(id: string, patch: Partial<Omit<Material, 'id' | 'createdAt'>>) {
    const material = materials.value.find((m) => m.id === id)
    if (material) Object.assign(material, patch, { updatedAt: Date.now() })
  }

  function removeMaterial(id: string) {
    materials.value = materials.value.filter((m) => m.id !== id)
  }

  function getMaterial(id: string): Material | undefined {
    return materials.value.find((m) => m.id === id)
  }

  /** 库存预警：数量低于最低库存预警值的材料 */
  const lowStockMaterials = computed(() =>
    materials.value.filter((m) => toNumber(m.quantity) < toNumber(m.minStock)),
  )

  /** 材料种类数 */
  const categoryCount = computed(() => materials.value.length)

  return {
    materials,
    addMaterial,
    updateMaterial,
    removeMaterial,
    getMaterial,
    lowStockMaterials,
    categoryCount,
  }
}
