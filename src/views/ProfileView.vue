<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToolStore } from '../stores/useToolStore'
import { useMaterialStore } from '../stores/useMaterialStore'
import { useProjectStore } from '../stores/useProjectStore'
import { useBorrowStore } from '../stores/useBorrowStore'
import { useAchievementStore } from '../stores/useAchievementStore'
import { STATUS_TAG, DIFFICULTY_TAG } from '../types'
import { isOverdue } from '../utils/format'
import AchievementGrid from '../components/AchievementGrid.vue'

const router = useRouter()
const toolStore = useToolStore()
const materialStore = useMaterialStore()
const projectStore = useProjectStore()
const borrowStore = useBorrowStore()
const achievementStore = useAchievementStore()

function toolName(id: string): string {
  return toolStore.getTool(id)?.name ?? '未知工具'
}

const activeTab = ref('badges')
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">个人中心</h2>
    </div>

    <div class="summary card">
      <div class="summary-item"><span class="num">{{ toolStore.totalQuantity.value }}</span><span>工具</span></div>
      <div class="summary-item"><span class="num">{{ materialStore.categoryCount.value }}</span><span>材料</span></div>
      <div class="summary-item"><span class="num">{{ projectStore.projects.value.length }}</span><span>项目</span></div>
      <div class="summary-item"><span class="num">{{ borrowStore.records.value.length }}</span><span>借还记录</span></div>
      <div class="summary-item"><span class="num" style="color: #e6a23c">{{ achievementStore.unlockedCount.value }}/{{ achievementStore.totalCount }}</span><span>成就</span></div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="成就徽章" name="badges">
        <AchievementGrid />
      </el-tab-pane>

      <el-tab-pane label="我的工具" name="tools">
        <el-table :data="toolStore.tools.value" size="small" border>
          <el-table-column prop="name" label="名称" min-width="130" />
          <el-table-column prop="category" label="类别" width="110" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column prop="status" label="状态" width="90" align="center" />
        </el-table>
        <el-empty v-if="!toolStore.tools.value.length" description="暂无工具" :image-size="60" />
      </el-tab-pane>

      <el-tab-pane label="我的材料" name="materials">
        <el-table :data="materialStore.materials.value" size="small" border>
          <el-table-column prop="name" label="名称" min-width="130" />
          <el-table-column prop="category" label="类别" width="110" />
          <el-table-column label="数量" width="110" align="center">
            <template #default="{ row }">{{ row.quantity }} {{ row.unit }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!materialStore.materials.value.length" description="暂无材料" :image-size="60" />
      </el-tab-pane>

      <el-tab-pane label="我的项目" name="projects">
        <el-table :data="projectStore.projects.value" size="small" border @row-click="(row: any) => router.push({ name: 'project-detail', params: { id: row.id } })">
          <el-table-column prop="name" label="名称" min-width="150" />
          <el-table-column label="难度" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="DIFFICULTY_TAG[row.difficulty as keyof typeof DIFFICULTY_TAG]" size="small">{{ row.difficulty }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="STATUS_TAG[row.status as keyof typeof STATUS_TAG]" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!projectStore.projects.value.length" description="暂无项目" :image-size="60" />
      </el-tab-pane>

      <el-tab-pane label="借还记录" name="borrows">
        <el-table :data="borrowStore.records.value" size="small" border>
          <el-table-column label="工具" min-width="120">
            <template #default="{ row }">{{ toolName(row.toolId) }}</template>
          </el-table-column>
          <el-table-column prop="borrower" label="借用人" width="100" />
          <el-table-column prop="borrowDate" label="借出日期" width="110" />
          <el-table-column prop="expectedReturnDate" label="预计归还" width="110" />
          <el-table-column prop="actualReturnDate" label="实际归还" width="110" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.actualReturnDate" type="success" size="small">已归还</el-tag>
              <el-tag v-else-if="isOverdue(row.expectedReturnDate)" type="danger" size="small">已逾期</el-tag>
              <el-tag v-else type="warning" size="small">未归还</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!borrowStore.records.value.length" description="暂无借还记录" :image-size="60" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 13px;
}
.summary-item .num {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
}
</style>
