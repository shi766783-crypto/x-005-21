<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { fileToBase64 } from '../utils/image'

/** 多张图片上传（自动压缩为 base64），通过 v-model 绑定 string[] */
const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>()

const loading = ref(false)

async function onChange(uploadFile: UploadFile) {
  const file = uploadFile.raw
  if (!file) return
  loading.value = true
  try {
    const base64 = await fileToBase64(file)
    emit('update:modelValue', [...props.modelValue, base64])
  } catch (e) {
    ElMessage.error((e as Error).message || '图片处理失败')
  } finally {
    loading.value = false
  }
}

function remove(index: number) {
  const list = [...props.modelValue]
  list.splice(index, 1)
  emit('update:modelValue', list)
}
</script>

<template>
  <div class="images-upload">
    <div v-for="(src, i) in modelValue" :key="i" class="thumb">
      <el-image :src="src" fit="cover" class="thumb-img" :preview-src-list="modelValue" :initial-index="i" />
      <el-button class="thumb-remove" size="small" type="danger" circle @click="remove(i)">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="onChange">
      <el-button :loading="loading" plain>
        <el-icon style="margin-right: 4px"><Plus /></el-icon>添加照片
      </el-button>
    </el-upload>
  </div>
</template>

<style scoped>
.images-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.thumb {
  position: relative;
}
.thumb-img {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 1px solid var(--border);
}
.thumb-remove {
  position: absolute;
  top: -8px;
  right: -8px;
}
</style>
