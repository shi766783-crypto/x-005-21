<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type {
  Project,
  ProjectCategory,
  Difficulty,
  ItemSource,
  ProjectToolItem,
  ProjectMaterialItem,
} from '../types'
import { PROJECT_CATEGORIES, DIFFICULTIES } from '../types'
import { useToolStore } from '../stores/useToolStore'
import { useMaterialStore } from '../stores/useMaterialStore'
import { useProjectStore } from '../stores/useProjectStore'
import { uid } from '../utils/id'
import { toNumber } from '../utils/format'

interface ToolRow {
  key: string
  source: ItemSource
  toolId: string
  name: string
  requiredQty: number
}
interface MaterialRow {
  key: string
  source: ItemSource
  materialId: string
  name: string
  unit: string
  requiredQty: number
}

const props = defineProps<{ modelValue: boolean; project: Project | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const toolStore = useToolStore()
const materialStore = useMaterialStore()
const projectStore = useProjectStore()
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  category: '家具制作' as ProjectCategory,
  description: '',
  estimatedHours: 1,
  difficulty: '简单' as Difficulty,
})

const toolRows = ref<ToolRow[]>([])
const materialRows = ref<MaterialRow[]>([])
const predecessorIds = ref<string[]>([])

/** 可被选为前置的项目：编辑时排除自身（自身不能作为自己的前置） */
const predecessorOptions = computed(() =>
  projectStore.projects.value.filter((p) => p.id !== props.project?.id),
)

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  estimatedHours: [{ required: true, message: '请输入预计工时', trigger: 'blur' }],
}

function reset(project: Project | null) {
  Object.assign(form, {
    name: project?.name ?? '',
    category: project?.category ?? '家具制作',
    description: project?.description ?? '',
    estimatedHours: project?.estimatedHours ?? 1,
    difficulty: project?.difficulty ?? '简单',
  })
  toolRows.value = (project?.tools ?? []).map((t) => ({
    key: t.key,
    source: t.source,
    toolId: t.toolId ?? '',
    name: t.name,
    requiredQty: t.requiredQty,
  }))
  materialRows.value = (project?.materials ?? []).map((m) => ({
    key: m.key,
    source: m.source,
    materialId: m.materialId ?? '',
    name: m.name,
    unit: m.unit,
    requiredQty: m.requiredQty,
  }))
  predecessorIds.value = project?.predecessorIds ? [...project.predecessorIds] : []
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) reset(props.project)
  },
)

function addToolRow() {
  toolRows.value.push({ key: uid('tr_'), source: 'library', toolId: '', name: '', requiredQty: 1 })
}
function addMaterialRow() {
  materialRows.value.push({
    key: uid('mr_'),
    source: 'library',
    materialId: '',
    name: '',
    unit: '个',
    requiredQty: 1,
  })
}
function removeToolRow(index: number) {
  toolRows.value.splice(index, 1)
}
function removeMaterialRow(index: number) {
  materialRows.value.splice(index, 1)
}

function onToolSelect(row: ToolRow, toolId: string) {
  const tool = toolStore.getTool(toolId)
  row.toolId = toolId
  row.name = tool?.name ?? ''
}
function onMaterialSelect(row: MaterialRow, materialId: string) {
  const material = materialStore.getMaterial(materialId)
  row.materialId = materialId
  row.name = material?.name ?? ''
  row.unit = material?.unit ?? '个'
}

/** 实时校验：新增的前置若会造成循环依赖，立即撤销并提示 */
function onPredecessorsChange(ids: string[]) {
  const { validIds, rejected } = projectStore.validatePredecessors(props.project?.id, ids)
  if (rejected.length) {
    predecessorIds.value = validIds
    ElMessage.warning(`不能选择「${rejected.map((p) => p.name).join('、')}」作为前置：会造成循环依赖`)
  }
}

/** 校验需求清单行是否完整 */
function validToolRow(row: ToolRow): boolean {
  return row.source === 'library' ? !!row.toolId : !!row.name.trim()
}
function validMaterialRow(row: MaterialRow): boolean {
  return row.source === 'library' ? !!row.materialId : !!row.name.trim()
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (toolRows.value.some((r) => !validToolRow(r)) || materialRows.value.some((r) => !validMaterialRow(r))) {
    ElMessage.warning('请完善需求清单（选择工具/材料或填写名称）')
    return
  }

  // 校验前置依赖：过滤自身、悬挂引用与循环依赖
  const { validIds, rejected } = projectStore.validatePredecessors(props.project?.id, predecessorIds.value)
  predecessorIds.value = validIds
  if (rejected.length) {
    ElMessage.warning(`已自动移除会造成循环依赖的前置：${rejected.map((p) => p.name).join('、')}`)
  }

  const tools: ProjectToolItem[] = toolRows.value.map((r) => ({
    key: r.key,
    name: r.name,
    requiredQty: toNumber(r.requiredQty),
    toolId: r.source === 'library' ? r.toolId : undefined,
    source: r.source,
  }))
  const materials: ProjectMaterialItem[] = materialRows.value.map((r) => ({
    key: r.key,
    name: r.name,
    requiredQty: toNumber(r.requiredQty),
    unit: r.unit,
    materialId: r.source === 'library' ? r.materialId : undefined,
    source: r.source,
  }))

  if (props.project) {
    projectStore.updateProject(props.project.id, {
      ...form,
      estimatedHours: toNumber(form.estimatedHours),
      tools,
      materials,
      predecessorIds: validIds,
    })
  } else {
    projectStore.addProject({
      ...form,
      estimatedHours: toNumber(form.estimatedHours),
      tools,
      materials,
      predecessorIds: validIds,
      status: '规划中',
    })
  }
  ElMessage.success(props.project ? '项目已更新' : '项目已创建')
  emit('saved')
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="project ? '编辑项目' : '创建 DIY 项目'"
    width="760px"
    top="5vh"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="form.name" placeholder="如：给书房做个书架" />
      </el-form-item>
      <el-form-item label="类别">
        <el-select v-model="form.category" style="width: 100%">
          <el-option v-for="c in PROJECT_CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="项目描述">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="描述项目目标与大致方案" />
      </el-form-item>
      <el-form-item label="预计工时" prop="estimatedHours">
        <el-input-number v-model="form.estimatedHours" :min="0" :step="1" />
        <span class="muted" style="margin-left: 8px">小时</span>
      </el-form-item>
      <el-form-item label="难度等级">
        <el-radio-group v-model="form.difficulty">
          <el-radio-button v-for="d in DIFFICULTIES" :key="d" :value="d">{{ d }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="前置项目">
        <el-select
          v-model="predecessorIds"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择需要先完成的项目，如先做柜子再装门"
          style="width: 100%"
          @change="onPredecessorsChange"
        >
          <el-option
            v-for="p in predecessorOptions"
            :key="p.id"
            :label="`${p.name}（${p.status}）`"
            :value="p.id"
          />
        </el-select>
        <div class="predecessor-hint">
          所选项目全部完成后，才建议开工本项目；会造成循环依赖的选择将被自动阻止。
        </div>
      </el-form-item>

      <el-divider content-position="left">所需工具</el-divider>
      <div v-for="(row, i) in toolRows" :key="row.key" class="item-row">
        <el-radio-group v-model="row.source" size="small">
          <el-radio-button value="library">从工具库</el-radio-button>
          <el-radio-button value="manual">手动添加</el-radio-button>
        </el-radio-group>
        <el-select
          v-if="row.source === 'library'"
          v-model="row.toolId"
          filterable
          placeholder="选择工具"
          class="item-select"
          @change="(v: string) => onToolSelect(row, v)"
        >
          <el-option
            v-for="t in toolStore.tools.value"
            :key="t.id"
            :label="`${t.name}（库存 ${t.quantity}）`"
            :value="t.id"
          />
        </el-select>
        <el-input v-else v-model="row.name" placeholder="工具名称" class="item-select" />
        <span class="muted">所需数量</span>
        <el-input-number v-model="row.requiredQty" :min="1" size="small" />
        <el-button size="small" type="danger" text @click="removeToolRow(i)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
      <el-button size="small" text type="primary" @click="addToolRow">
        <el-icon><Plus /></el-icon> 添加工具
      </el-button>

      <el-divider content-position="left">所需材料</el-divider>
      <div v-for="(row, i) in materialRows" :key="row.key" class="item-row">
        <el-radio-group v-model="row.source" size="small">
          <el-radio-button value="library">从材料库</el-radio-button>
          <el-radio-button value="manual">手动添加</el-radio-button>
        </el-radio-group>
        <el-select
          v-if="row.source === 'library'"
          v-model="row.materialId"
          filterable
          placeholder="选择材料"
          class="item-select"
          @change="(v: string) => onMaterialSelect(row, v)"
        >
          <el-option
            v-for="m in materialStore.materials.value"
            :key="m.id"
            :label="`${m.name}（库存 ${m.quantity}${m.unit}）`"
            :value="m.id"
          />
        </el-select>
        <template v-else>
          <el-input v-model="row.name" placeholder="材料名称" class="item-select" />
          <el-input v-model="row.unit" placeholder="单位" style="width: 90px" />
        </template>
        <span class="muted">所需数量</span>
        <el-input-number v-model="row.requiredQty" :min="1" size="small" />
        <el-button size="small" type="danger" text @click="removeMaterialRow(i)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
      <el-button size="small" text type="primary" @click="addMaterialRow">
        <el-icon><Plus /></el-icon> 添加材料
      </el-button>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.item-select {
  width: 220px;
}
.predecessor-hint {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  line-height: 1.5;
  margin-top: 4px;
}
</style>
