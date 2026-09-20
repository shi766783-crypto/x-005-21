import { computed } from 'vue'
import type { BorrowRecord } from '../types'
import { useLocalStorage } from '../utils/storage'
import { uid } from '../utils/id'
import { toNumber, isOnOrBefore } from '../utils/format'

// 模块级单例状态
const records = useLocalStorage<BorrowRecord[]>('diy.borrows', [])

export function useBorrowStore() {
  function addRecord(
    data: Omit<BorrowRecord, 'id' | 'createdAt' | 'actualReturnDate'>,
  ): BorrowRecord {
    const record: BorrowRecord = { ...data, id: uid('borrow_'), createdAt: Date.now() }
    records.value.push(record)
    return record
  }

  /** 归还：写入实际归还日期 */
  function returnTool(id: string, actualReturnDate: string) {
    const record = records.value.find((r) => r.id === id)
    if (record) record.actualReturnDate = actualReturnDate
  }

  function removeRecord(id: string) {
    records.value = records.value.filter((r) => r.id !== id)
  }

  /** 未归还记录（首页提醒用） */
  const unreturned = computed(() => records.value.filter((r) => !r.actualReturnDate))

  /** 各工具当前被借出数量：toolId -> 未归还数量之和 */
  const borrowedByTool = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const r of unreturned.value) {
      map[r.toolId] = (map[r.toolId] ?? 0) + toNumber(r.quantity)
    }
    return map
  })

  /** 已归还记录 */
  const returned = computed(() => records.value.filter((r) => !!r.actualReturnDate))

  /** 借还准时率 = 按时归还数 / 已归还总数（无归还记录时视为 1，表示尚无逾期） */
  const punctualityRate = computed(() => {
    const list = returned.value
    if (list.length === 0) return 1
    const onTime = list.filter((r) => isOnOrBefore(r.actualReturnDate!, r.expectedReturnDate)).length
    return onTime / list.length
  })

  return { records, addRecord, returnTool, removeRecord, unreturned, borrowedByTool, returned, punctualityRate }
}
