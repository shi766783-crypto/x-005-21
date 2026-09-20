<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useToolStore } from '../stores/useToolStore'
import { useBorrowStore } from '../stores/useBorrowStore'
import { toNumber, today } from '../utils/format'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>()

const toolStore = useToolStore()
const borrowStore = useBorrowStore()
const formRef = ref<FormInstance>()

const form = reactive({
  toolId: '',
  borrower: '',
  quantity: 1,
  borrowDate: today(),
  expectedReturnDate: '',
})

const rules: FormRules = {
  toolId: [{ required: true, message: '请选择工具', trigger: 'change' }],
  borrower: [{ required: true, message: '请输入借用人', trigger: 'blur' }],
  expectedReturnDate: [{ required: true, message: '请选择预计归还日期', trigger: 'change' }],
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      Object.assign(form, {
        toolId: '',
        borrower: '',
        quantity: 1,
        borrowDate: today(),
        expectedReturnDate: '',
      })
    }
  },
)

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  borrowStore.addRecord({
    toolId: form.toolId,
    borrower: form.borrower,
    quantity: toNumber(form.quantity),
    borrowDate: form.borrowDate,
    expectedReturnDate: form.expectedReturnDate,
  })
  ElMessage.success('借出记录已保存')
  emit('saved')
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="工具借出登记"
    width="520px"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="工具" prop="toolId">
        <el-select v-model="form.toolId" filterable style="width: 100%">
          <el-option
            v-for="t in toolStore.tools.value"
            :key="t.id"
            :label="`${t.name}（库存 ${t.quantity}）`"
            :value="t.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="借用人" prop="borrower">
        <el-input v-model="form.borrower" placeholder="如：邻居老张" />
      </el-form-item>
      <el-form-item label="借出数量">
        <el-input-number v-model="form.quantity" :min="1" />
      </el-form-item>
      <el-form-item label="借出日期">
        <el-date-picker v-model="form.borrowDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>
      <el-form-item label="预计归还" prop="expectedReturnDate">
        <el-date-picker
          v-model="form.expectedReturnDate"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>
