<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Tool } from '../types'
import { TOOL_CATEGORIES, TOOL_STATUSES } from '../types'
import { useToolStore } from '../stores/useToolStore'
import { useBorrowStore } from '../stores/useBorrowStore'
import ToolFormDialog from '../components/ToolFormDialog.vue'
import BorrowFormDialog from '../components/BorrowFormDialog.vue'

const toolStore = useToolStore()
const borrowStore = useBorrowStore()

const dialogVisible = ref(false)
const editingTool = ref<Tool | null>(null)
const borrowVisible = ref(false)

const filterCategory = ref('')
const filterStatus = ref('')
const keyword = ref('')

const filtered = computed(() =>
  toolStore.tools.value.filter((t) => {
    const matchCategory = !filterCategory.value || t.category === filterCategory.value
    const matchStatus = !filterStatus.value || t.status === filterStatus.value
    const matchKeyword = !keyword.value || t.name.includes(keyword.value)
    return matchCategory && matchStatus && matchKeyword
  }),
)

function openAdd() {
  editingTool.value = null
  dialogVisible.value = true
}
function openEdit(tool: Tool) {
  editingTool.value = tool
  dialogVisible.value = true
}
async function remove(tool: Tool) {
  await ElMessageBox.confirm(`确定删除工具「${tool.name}」吗？`, '提示', { type: 'warning' })
  toolStore.removeTool(tool.id)
  ElMessage.success('已删除')
}

function borrowedQty(toolId: string): number {
  return borrowStore.borrowedByTool.value[toolId] ?? 0
}

const statusTag = { 完好: 'success', 需维修: 'danger', 已借出: 'warning' } as const
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">工具库存</h2>
      <div>
        <el-button type="primary" @click="borrowVisible = true">
          <el-icon><Share /></el-icon>&nbsp;登记借出
        </el-button>
        <el-button type="primary" @click="openAdd">
          <el-icon><Plus /></el-icon>&nbsp;添加工具
        </el-button>
      </div>
    </div>

    <div class="card filter-bar">
      <el-input v-model="keyword" placeholder="搜索工具名称" clearable style="width: 200px" />
      <el-select v-model="filterCategory" placeholder="全部类别" clearable style="width: 150px">
        <el-option v-for="c in TOOL_CATEGORIES" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 150px">
        <el-option v-for="s in TOOL_STATUSES" :key="s" :label="s" :value="s" />
      </el-select>
      <span class="muted">共 {{ toolStore.tools.value.length }} 件工具，合计 {{ toolStore.totalQuantity.value }} 件</span>
    </div>

    <div class="card">
      <el-table :data="filtered" border>
        <el-table-column label="照片" width="80" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.photo"
              :src="row.photo"
              fit="cover"
              style="width: 40px; height: 40px; border-radius: 4px"
              :preview-src-list="[row.photo]"
            />
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="130" />
        <el-table-column prop="category" label="类别" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column label="已借出" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ color: borrowedQty(row.id) > 0 ? 'var(--warning)' : 'inherit' }">
              {{ borrowedQty(row.id) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" min-width="120" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag[row.status as keyof typeof statusTag]" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" text @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ToolFormDialog v-model="dialogVisible" :tool="editingTool" />
    <BorrowFormDialog v-model="borrowVisible" />
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>
