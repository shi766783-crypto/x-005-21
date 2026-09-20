<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { ProjectStatus } from '../types'
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

function changeStatus(status: ProjectStatus) {
  if (!project.value) return
  projectStore.updateProject(project.value.id, { status })
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
</style>
