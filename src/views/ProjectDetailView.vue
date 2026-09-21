<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ProjectStatus, PredecessorState } from '../types'
import { PROJECT_STATUSES, DIFFICULTY_TAG, STATUS_TAG } from '../types'
import { useProjectStore } from '../stores/useProjectStore'
import GapPanel from '../components/GapPanel.vue'
import ImagesUpload from '../components/ImagesUpload.vue'
import { formatDate, toNumber } from '../utils/format'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const project = computed(() => projectStore.getProject(route.params.id as string))
const gap = computed(() => (project.value ? projectStore.computeGap(project.value) : null))

/** 前置项目状态明细 */
const predecessors = computed<PredecessorState[]>(() =>
  project.value ? projectStore.predecessorStates(project.value) : [],
)
const unfinished = computed(() => predecessors.value.filter((s) => !s.done))
const blocked = computed(() => project.value && project.value.status !== '已搁置' && unfinished.value.length > 0)

const form = reactive({
  actualHours: undefined as number | undefined,
  actualCost: undefined as number | undefined,
  resultPhotos: [] as string[],
  gains: '',
  problems: '',
  improvements: '',
  selfRating: 0,
  toolsEnough: null as boolean | null,
  materialWaste: null as boolean | null,
})

function syncForm() {
  if (!project.value) return
  form.actualHours = project.value.actualHours
  form.actualCost = project.value.actualCost
  form.resultPhotos = project.value.resultPhotos ?? []
  form.gains = project.value.summary?.gains ?? ''
  form.problems = project.value.summary?.problems ?? ''
  form.improvements = project.value.summary?.improvements ?? ''
  form.selfRating = project.value.selfRating ?? 0
  form.toolsEnough = project.value.feedback?.toolsEnough ?? null
  form.materialWaste = project.value.feedback?.materialWaste ?? null
}

watch(project, syncForm, { immediate: true })

/**
 * 切换项目状态：
 * - 开始进行：前置未全部完成时提示并要求确认（允许强制开工）
 * - 改为搁置：存在依赖本项目的下游项目时，提醒用户确认影响
 */
async function changeStatus(status: ProjectStatus) {
  if (!project.value) return
  const current = project.value

  if (status === '进行中' || status === '已完成') {
    const blockers = projectStore.unfinishedPredecessors(current)
    if (blockers.length) {
      const action = status === '已完成' ? '标记完成' : '开始'
      try {
        await ElMessageBox.confirm(
          `以下前置项目还未完成，按计划应先完成它们再${action}本项目：\n\n` +
            blockers.map((b) => `· ${b.name}（${b.status}）`).join('\n') +
            `\n\n是否仍要强制${action}？`,
          '前置项目尚未完成',
          { type: 'warning', confirmButtonText: `仍要${action}`, cancelButtonText: '先不操作' },
        )
      } catch {
        return // 用户取消，保持原状态
      }
    }
  }

  if (status === '已搁置' && current.status !== '已搁置') {
    const dependents = projectStore.dependentsOf(current.id)
    if (dependents.length) {
      try {
        await ElMessageBox.confirm(
          `本项目被以下 ${dependents.length} 个项目设为前置，搁置后它们将因前置未完成而无法正常开工：\n\n` +
            dependents.map((d) => `· ${d.name}`).join('\n') +
            '\n\n确定搁置吗？',
          '搁置前置项目需确认',
          { type: 'warning', confirmButtonText: '仍要搁置', cancelButtonText: '取消' },
        )
      } catch {
        return
      }
    }
  }

  projectStore.updateProject(current.id, { status })
  ElMessage.success(`项目状态已更新为「${status}」`)
}

function onStatusChange(v: string | number | boolean) {
  changeStatus(String(v) as ProjectStatus)
}

function saveRecord() {
  if (!project.value) return
  projectStore.updateProject(project.value.id, {
    actualHours: form.actualHours === undefined ? undefined : toNumber(form.actualHours),
    actualCost: form.actualCost === undefined ? undefined : toNumber(form.actualCost),
    resultPhotos: form.resultPhotos,
    summary: {
      gains: form.gains,
      problems: form.problems,
      improvements: form.improvements,
    },
    selfRating: form.selfRating,
    feedback: {
      toolsEnough: form.toolsEnough,
      materialWaste: form.materialWaste,
    },
  })
  ElMessage.success('项目记录已保存')
}
</script>

<template>
  <div class="page" v-if="project">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px">
        <el-button text @click="router.push({ name: 'projects' })">
          <el-icon><ArrowLeft /></el-icon>返回
        </el-button>
        <h2 class="page-title">{{ project.name }}</h2>
        <el-tag :type="STATUS_TAG[project.status]" size="small">{{ project.status }}</el-tag>
      </div>
      <div style="display: flex; align-items: center; gap: 10px">
        <span class="muted">创建于 {{ formatDate(project.createdAt) }}</span>
        <el-radio-group :model-value="project.status" size="small" @update:model-value="onStatusChange">
          <el-radio-button v-for="s in PROJECT_STATUSES" :key="s" :value="s">{{ s }}</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-alert
      v-if="blocked"
      class="blocked-alert"
      type="warning"
      show-icon
      :closable="false"
      title="前置项目尚未全部完成，暂不建议开工"
    >
      <template #default>
        <div v-for="b in unfinished" :key="b.id" class="blocked-line">
          · {{ b.name }}（当前状态：{{ b.status }}）
        </div>
      </template>
    </el-alert>

    <section v-if="predecessors.length" class="card" style="margin-bottom: 16px">
      <div class="section-title">
        前置项目
        <el-tag size="small" :type="blocked ? 'warning' : 'success'" style="margin-left: 8px">
          {{ blocked ? `${unfinished.length} 项未完成` : '已全部完成' }}
        </el-tag>
      </div>
      <el-table :data="predecessors" size="small" border>
        <el-table-column label="项目名称" min-width="150">
          <template #default="{ row }">
            <el-link
              type="primary"
              :underline="false"
              @click="router.push({ name: 'project-detail', params: { id: row.id } })"
            >
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="STATUS_TAG[row.status as keyof typeof STATUS_TAG]" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否完成" width="100" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.done" color="var(--success)"><CircleCheckFilled /></el-icon>
            <span v-else class="gap-missing">未完成</span>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <div class="info-grid">
      <div class="card">
        <div class="info-item"><span class="info-label">类别</span>{{ project.category }}</div>
        <div class="info-item">
          <span class="info-label">难度</span>
          <el-tag :type="DIFFICULTY_TAG[project.difficulty]" size="small">{{ project.difficulty }}</el-tag>
        </div>
        <div class="info-item"><span class="info-label">预计工时</span>{{ project.estimatedHours }} 小时</div>
        <div class="info-item" v-if="project.completedAt">
          <span class="info-label">完成时间</span>{{ formatDate(project.completedAt) }}
        </div>
      </div>
      <div class="card">
        <div class="info-label">项目描述</div>
        <p style="margin: 6px 0 0">{{ project.description || '（暂无描述）' }}</p>
      </div>
    </div>

    <section class="card" style="margin-bottom: 16px">
      <div class="section-title">库存缺口分析</div>
      <GapPanel v-if="gap" :gap="gap" />
    </section>

    <section class="card" style="margin-bottom: 16px">
      <div class="section-title">进度记录</div>
      <div class="form-grid">
        <el-form-item label="实际用时（小时）">
          <el-input-number v-model="form.actualHours" :min="0" />
        </el-form-item>
        <el-form-item label="实际花费（元）">
          <el-input-number v-model="form.actualCost" :min="0" />
        </el-form-item>
      </div>
    </section>

    <section class="card" style="margin-bottom: 16px">
      <div class="section-title">成果与总结</div>
      <el-form label-width="90px">
        <el-form-item label="成果照片">
          <ImagesUpload v-model="form.resultPhotos" />
        </el-form-item>
        <el-form-item label="收获">
          <el-input v-model="form.gains" type="textarea" :rows="2" placeholder="这个项目有什么收获？" />
        </el-form-item>
        <el-form-item label="遇到的问题">
          <el-input v-model="form.problems" type="textarea" :rows="2" placeholder="过程中遇到了哪些问题？" />
        </el-form-item>
        <el-form-item label="改进点">
          <el-input v-model="form.improvements" type="textarea" :rows="2" placeholder="下次可以如何改进？" />
        </el-form-item>
        <el-form-item label="项目自评">
          <el-rate v-model="form.selfRating" />
        </el-form-item>
        <el-form-item label="工具够用">
          <el-radio-group v-model="form.toolsEnough">
            <el-radio :value="true">够用</el-radio>
            <el-radio :value="false">不够用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="材料浪费">
          <el-radio-group v-model="form.materialWaste">
            <el-radio :value="true">有浪费</el-radio>
            <el-radio :value="false">未浪费</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveRecord">保存项目记录</el-button>
        </el-form-item>
      </el-form>
    </section>
  </div>

  <div class="page" v-else>
    <el-empty description="项目不存在">
      <el-button type="primary" @click="router.push({ name: 'projects' })">返回项目列表</el-button>
    </el-empty>
  </div>
</template>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.info-label {
  color: var(--text-secondary);
  width: 70px;
  flex-shrink: 0;
}
.section-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 12px;
}
.form-grid {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}
.blocked-alert {
  margin-bottom: 16px;
}
.blocked-line {
  line-height: 1.8;
}
</style>
