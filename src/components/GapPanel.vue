<script setup lang="ts">
import type { ProjectGap } from '../types'

/** 库存缺口分析面板：纯展示组件，接收 computeGap 的计算结果 */
defineProps<{ gap: ProjectGap }>()
</script>

<template>
  <div class="gap-panel">
    <el-alert
      v-if="gap.hasGap"
      type="warning"
      :closable="false"
      show-icon
      title="存在库存缺口，已生成待采购 / 待借用清单"
      class="gap-alert"
    />
    <el-alert v-else type="success" :closable="false" show-icon title="库存充足，可以开工" class="gap-alert" />

    <template v-if="gap.tools.length">
      <div class="gap-subtitle">待借用 / 待采购工具</div>
      <el-table :data="gap.tools" size="small" border>
        <el-table-column prop="name" label="工具" min-width="120" />
        <el-table-column label="来源" width="90">
          <template #default="{ row }">
            <el-tag :type="row.source === 'library' ? 'info' : 'warning'" size="small">
              {{ row.source === 'library' ? '工具库' : '手动添加' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requiredQty" label="所需" width="70" align="center" />
        <el-table-column prop="availableQty" label="可用" width="70" align="center" />
        <el-table-column label="缺口" width="90" align="center">
          <template #default="{ row }">
            <span class="gap-missing">{{ row.missingQty }}</span>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template v-if="gap.materials.length">
      <div class="gap-subtitle">待采购材料</div>
      <el-table :data="gap.materials" size="small" border>
        <el-table-column prop="name" label="材料" min-width="120" />
        <el-table-column label="来源" width="90">
          <template #default="{ row }">
            <el-tag :type="row.source === 'library' ? 'info' : 'warning'" size="small">
              {{ row.source === 'library' ? '材料库' : '手动添加' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="70" align="center" />
        <el-table-column prop="requiredQty" label="所需" width="70" align="center" />
        <el-table-column prop="availableQty" label="可用" width="70" align="center" />
        <el-table-column label="缺口" width="90" align="center">
          <template #default="{ row }">
            <span class="gap-missing">{{ row.missingQty }}</span>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
</template>

<style scoped>
.gap-alert {
  margin-bottom: 12px;
}
.gap-subtitle {
  font-size: 14px;
  font-weight: 600;
  margin: 12px 0 8px;
}
</style>
