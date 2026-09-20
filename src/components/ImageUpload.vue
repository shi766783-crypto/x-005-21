<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { fileToBase64 } from '../utils/image'

/** 单张图片上传（自动压缩为 base64），通过 v-model 绑定 */
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const loading = ref(false)

async function onChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file) return
  loading.value = true
  try {
    emit('update:modelValue', await fileToBase64(file))
  } catch (e) {
    ElMessage.error((e as Error).message || '图片处理失败')
  } finally {
    loading.value = false
  }
}

function clear() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="image-upload">
    <div v-if="modelValue" class="preview">
      <el-image :src="modelValue" fit="cover" class="preview-img" :preview-src-list="[modelValue]" />
      <div class="preview-actions">
        <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="onChange">
          <el-button size="small">更换</el-button>
        </el-upload>
        <el-button size="small" type="danger" plain @click="clear">移除</el-button>
      </div>
    </div>
    <el-upload v-else :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="onChange">
      <el-button :loading="loading" type="primary" plain>
        <el-icon style="margin-right: 4px"><Plus /></el-icon>上传照片
      </el-button>
    </el-upload>
  </div>
</template>

<style scoped>
.preview {
  display: flex;
  align-items: center;
  gap: 12px;
}
.preview-img {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 1px solid var(--border);
}
.preview-actions {
  display: flex;
  gap: 8px;
}
</style>
