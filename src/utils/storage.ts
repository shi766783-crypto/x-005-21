import { ref, watch, type Ref } from 'vue'

/**
 * 响应式 localStorage 封装。
 * 在模块顶层调用一次即形成单例状态；任何写操作通过深度 watch 自动持久化。
 * 解析失败时回退到默认值，避免脏数据导致应用崩溃。
 */
export function useLocalStorage<T>(key: string, initial: T): Ref<T> {
  let data: T = initial
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) data = JSON.parse(raw) as T
  } catch {
    data = initial
  }

  const state = ref(data) as Ref<T>

  watch(
    state,
    (val) => {
      try {
        localStorage.setItem(key, JSON.stringify(val))
      } catch (e) {
        // localStorage 超配额（例如大量 base64 图片）时给出提示，避免静默失败
        console.error(`[storage] 写入 ${key} 失败，可能是存储空间不足`, e)
      }
    },
    { deep: true },
  )

  return state
}
