<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Material, MaterialCategory } from '../types'
import { MATERIAL_CATEGORIES } from '../types'
import { useMaterialStore } from '../stores/useMaterialStore'
import { toNumber } from '../utils/format'

const props = defineProps<{ modelValue: boolean; material: Material | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const store = useMaterialStore()
const formRef = ref<FormInstance>()

const emptyForm = {
  name: '',
  category: '木材' as MaterialCategory,
  quantity: 0,
  unit: '个',
  minStock: 0,
  location: '',
}

const form = reactive({ ...emptyForm })

const rules: FormRules = {
  name: [{ required: true, message: '请输入材料名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) Object.assign(form, props.material ?? emptyForm)
  },
)

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const payload = {
    ...form,
    quantity: toNumber(form.quantity),
    minStock: toNumber(form.minStock),
  }
  if (props.material) store.updateMaterial(props.material.id, payload)
  else store.addMaterial(payload)
  ElMessage.success(props.material ? '材料已更新' : '材料已添加')
  emit('saved')
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="material ? '编辑材料' : '添加材料'"
    width="520px"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="如：松木板" />
      </el-form-item>
      <el-form-item label="类别" prop="category">
        <el-select v-model="form.category" style="width: 100%">
          <el-option v-for="c in MATERIAL_CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="数量">
        <el-input-number v-model="form.quantity" :min="0" />
      </el-form-item>
      <el-form-item label="单位" prop="unit">
        <el-input v-model="form.unit" placeholder="如：块 / 米 / 个" />
      </el-form-item>
      <el-form-item label="最低库存">
        <el-input-number v-model="form.minStock" :min="0" />
        <span class="muted" style="margin-left: 8px">低于该值触发预警</span>
      </el-form-item>
      <el-form-item label="存放位置">
        <el-input v-model="form.location" placeholder="如：储物间 A 区" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>
