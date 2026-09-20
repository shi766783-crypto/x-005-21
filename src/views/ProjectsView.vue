<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Project } from '../types'
import { PROJECT_CATEGORIES, PROJECT_STATUSES, DIFFICULTY_TAG, STATUS_TAG } from '../types'
import { useProjectStore } from '../stores/useProjectStore'
import ProjectFormDialog from '../components/ProjectFormDialog.vue'

const router = useRouter()
const projectStore = useProjectStore()

const dialogVisible = ref(false)
const editingProject = ref<Project | null>(null)

const filterStatus = ref('')
const filterCategory = ref('')
const keyword = ref('')

const filtered = computed(() =>
  projectStore.projects.value.filter((p) => {
    const matchStatus = !filterStatus.value || p.status === filterStatus.value
    const matchCategory = !filterCategory.value || p.category === filterCategory.value
    const matchKeyword = !keyword.value || p.name.includes(keyword.value)
    return matchStatus && matchCategory && matchKeyword
  }),
)

function gapCount(p: Project): number {
  const gap = projectStore.computeGap(p)
  return gap.tools.length + gap.materials.length
}

function openCreate() {
  editingProject.value = null
  dialogVisible.value = true
}
function openEdit(p: Project) {
  editingProject.value = p
  dialogVisible.value = true
}
async function remove(p: Project) {
  await ElMessageBox.confirm(`确定删除项目「${p.name}」吗？`, '提示', { type: 'warning' })
  projectStore.removeProject(p.id)
  ElMessage.success('已删除')
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">DIY 项目</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>&nbsp;创建项目
      </el-button>
    </div>

    <div class="card filter-bar">
      <el-input v-model="keyword" placeholder="搜索项目名称" clearable style="width: 200px" />
      <el-select v-model="filterCategory" placeholder="全部类别" clearable style="width: 150px">
        <el-option v-for="c in PROJECT_CATEGORIES" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 150px">
        <el-option v-for="s in PROJECT_STATUSES" :key="s" :label="s" :value="s" />
      </el-select>
      <span class="muted">共 {{ projectStore.projects.value.length }} 个项目</span>
    </div>

    <div class="card">
      <el-table :data="filtered" border @row-click="(row: Project) => router.push({ name: 'project-detail', params: { id: row.id } })">
        <el-table-column prop="name" label="项目名称" min-width="150" />
        <el-table-column prop="category" label="类别" width="100" />
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
        <el-table-column label="库存缺口" width="110" align="center">
          <template #default="{ row }">
            <span v-if="gapCount(row) > 0" class="gap-missing">{{ gapCount(row) }} 项缺口</span>
            <span v-else style="color: var(--success)">充足</span>
          </template>
        </el-table-column>
        <el-table-column label="预计工时" width="90" align="center">
          <template #default="{ row }">{{ row.estimatedHours }}h</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button size="small" @click.stop="router.push({ name: 'project-detail', params: { id: row.id } })">详情</el-button>
            <el-button size="small" @click.stop="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" text @click.stop="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!filtered.length" description="暂无项目，点击右上角创建" />
    </div>

    <ProjectFormDialog v-model="dialogVisible" :project="editingProject" />
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
