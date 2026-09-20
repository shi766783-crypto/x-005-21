<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDashboard } from '../composables/useDashboard'
import { useToolStore } from '../stores/useToolStore'
import { useBorrowStore } from '../stores/useBorrowStore'
import StatCard from '../components/StatCard.vue'
import { today, isOverdue } from '../utils/format'

const router = useRouter()
const { stats, unreturnedBorrows, lowStockMaterials } = useDashboard()
const toolStore = useToolStore()
const borrowStore = useBorrowStore()

function toolName(id: string): string {
  return toolStore.getTool(id)?.name ?? '未知工具'
}

function goReturn(recordId: string) {
  borrowStore.returnTool(recordId, today())
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">首页概览</h2>
    </div>

    <div class="stat-grid">
      <StatCard label="工具总数" :value="stats.toolTotal" color="#409eff" icon="Suitcase" />
      <StatCard label="材料种类" :value="stats.materialKinds" color="#67c23a" icon="Box" />
      <StatCard label="进行中项目" :value="stats.inProgress" color="#e6a23c" icon="Loading" />
      <StatCard label="本月完成项目" :value="stats.completedThisMonth" color="#9c27b0" icon="Medal" />
      <StatCard label="库存预警" :value="stats.lowStock" color="#f56c6c" icon="Warning" />
    </div>

    <div class="two-col">
      <section class="card">
        <div class="section-head">
          <span class="section-title">未归还工具提醒</span>
          <el-tag v-if="unreturnedBorrows.length" type="danger">{{ unreturnedBorrows.length }} 件未归还</el-tag>
          <el-tag v-else type="success">全部已归还</el-tag>
        </div>
        <el-table v-if="unreturnedBorrows.length" :data="unreturnedBorrows" size="small">
          <el-table-column label="工具" min-width="100">
            <template #default="{ row }">{{ toolName(row.toolId) }}</template>
          </el-table-column>
          <el-table-column prop="borrower" label="借用人" min-width="80" />
          <el-table-column label="预计归还" width="110">
            <template #default="{ row }">
              <span :style="{ color: isOverdue(row.expectedReturnDate) ? 'var(--danger)' : 'inherit' }">
                {{ row.expectedReturnDate }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" text @click="goReturn(row.id)">归还</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无未归还工具" :image-size="60" />
      </section>

      <section class="card">
        <div class="section-head">
          <span class="section-title">库存预警</span>
          <el-tag v-if="lowStockMaterials.length" type="warning">{{ lowStockMaterials.length }} 种需补货</el-tag>
          <el-tag v-else type="success">库存充足</el-tag>
        </div>
        <el-table v-if="lowStockMaterials.length" :data="lowStockMaterials" size="small">
          <el-table-column prop="name" label="材料" min-width="100" />
          <el-table-column label="当前库存" width="110" align="center">
            <template #default="{ row }">
              <span class="gap-missing">{{ row.quantity }} {{ row.unit }}</span>
            </template>
          </el-table-column>
          <el-table-column label="预警值" width="90" align="center">
            <template #default="{ row }">{{ row.minStock }} {{ row.unit }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无预警材料" :image-size="60" />
      </section>
    </div>

    <section class="card quick-actions">
      <span class="section-title">快速入口</span>
      <div class="quick-btns">
        <el-button type="primary" @click="router.push({ name: 'tools' })">
          <el-icon><Suitcase /></el-icon>&nbsp;管理工具
        </el-button>
        <el-button type="success" @click="router.push({ name: 'materials' })">
          <el-icon><Box /></el-icon>&nbsp;管理材料
        </el-button>
        <el-button type="warning" @click="router.push({ name: 'projects' })">
          <el-icon><Notebook /></el-icon>&nbsp;创建项目
        </el-button>
        <el-button @click="router.push({ name: 'dashboard' })">
          <el-icon><DataAnalysis /></el-icon>&nbsp;查看看板
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-title {
  font-weight: 600;
  font-size: 15px;
}
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.quick-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
