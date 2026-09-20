/** 生成一个带前缀的唯一 ID（时间戳 + 随机数，前端无需引入 uuid 依赖） */
export function uid(prefix = ''): string {
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}${time}${rand}`
}
