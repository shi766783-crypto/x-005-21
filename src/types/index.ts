// 领域模型与常量定义
// 纯类型与常量层：不依赖任何运行时库，供 store / composable / 组件复用

// ---------- 工具 ----------
export type ToolCategory = '手动工具' | '电动工具' | '测量工具' | '安全防护' | '其他'
export type ToolStatus = '完好' | '需维修' | '已借出'

export interface Tool {
  id: string
  name: string
  category: ToolCategory
  quantity: number // 拥有数量
  location: string
  status: ToolStatus
  photo?: string // base64，可选
  createdAt: number
  updatedAt: number
}

// ---------- 材料 ----------
export type MaterialCategory = '木材' | '五金' | '电子元件' | '涂料' | '胶粘剂' | '其他'

export interface Material {
  id: string
  name: string
  category: MaterialCategory
  quantity: number
  unit: string
  minStock: number // 最低库存预警值
  location: string
  createdAt: number
  updatedAt: number
}

// ---------- 项目 ----------
export type ProjectCategory = '家具制作' | '水电维修' | '电子制作' | '家居改造' | '其他'
export type Difficulty = '简单' | '中等' | '困难'
export type ProjectStatus = '规划中' | '进行中' | '已完成' | '已搁置'
export type ItemSource = 'library' | 'manual'

/** 项目所需工具项（可从工具库选择，或手动添加） */
export interface ProjectToolItem {
  key: string
  name: string
  requiredQty: number
  toolId?: string
  source: ItemSource
}

/** 项目所需材料项（可从材料库选择，或手动添加） */
export interface ProjectMaterialItem {
  key: string
  name: string
  requiredQty: number
  unit: string
  materialId?: string
  source: ItemSource
}

export interface ProjectSummary {
  gains: string // 收获
  problems: string // 遇到的问题
  improvements: string // 改进点
}

export interface ProjectFeedback {
  toolsEnough: boolean | null // 工具是否够用
  materialWaste: boolean | null // 材料是否浪费
}

/** 单个前置项目的当前状态，用于依赖检查与提醒 */
export interface PredecessorState {
  id: string
  name: string
  status: ProjectStatus
  done: boolean // 是否已完成（只有「已完成」才算前置达成）
}

export interface Project {
  id: string
  name: string
  category: ProjectCategory
  description: string
  estimatedHours: number
  difficulty: Difficulty
  tools: ProjectToolItem[]
  materials: ProjectMaterialItem[]
  predecessorIds: string[] // 前置项目 id：前置项目全部完成后才建议开工
  status: ProjectStatus
  actualHours?: number // 实际用时
  actualCost?: number // 实际花费
  resultPhotos?: string[] // 成果照片 base64
  summary?: ProjectSummary
  selfRating?: number // 1-5 星自评
  feedback?: ProjectFeedback
  createdAt: number
  updatedAt: number
  completedAt?: number
}

// ---------- 借还记录 ----------
export interface BorrowRecord {
  id: string
  toolId: string
  borrower: string
  quantity: number // 借出数量
  borrowDate: string // YYYY-MM-DD
  expectedReturnDate: string // YYYY-MM-DD
  actualReturnDate?: string // 实际归还日期，未归还时为空
  createdAt: number
}

// ---------- 缺口分析 ----------
export interface ToolGap {
  key: string
  name: string
  requiredQty: number
  availableQty: number
  missingQty: number
  source: ItemSource
}

export interface MaterialGap {
  key: string
  name: string
  requiredQty: number
  availableQty: number
  missingQty: number
  unit: string
  source: ItemSource
}

export interface ProjectGap {
  tools: ToolGap[] // 仅包含缺口 > 0 的工具
  materials: MaterialGap[] // 仅包含缺口 > 0 的材料
  hasGap: boolean
}

// ---------- 成就 ----------
export interface AchievementDef {
  code: string
  name: string
  description: string
  icon: string // Element Plus 图标组件名
}

// ---------- 常量 ----------
export const TOOL_CATEGORIES: ToolCategory[] = ['手动工具', '电动工具', '测量工具', '安全防护', '其他']
export const TOOL_STATUSES: ToolStatus[] = ['完好', '需维修', '已借出']

export const MATERIAL_CATEGORIES: MaterialCategory[] = ['木材', '五金', '电子元件', '涂料', '胶粘剂', '其他']

export const PROJECT_CATEGORIES: ProjectCategory[] = ['家具制作', '水电维修', '电子制作', '家居改造', '其他']
export const DIFFICULTIES: Difficulty[] = ['简单', '中等', '困难']
export const PROJECT_STATUSES: ProjectStatus[] = ['规划中', '进行中', '已完成', '已搁置']

export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  简单: 1,
  中等: 2,
  困难: 3,
}

export const DIFFICULTY_TAG: Record<Difficulty, 'info' | 'warning' | 'danger'> = {
  简单: 'info',
  中等: 'warning',
  困难: 'danger',
}

export const STATUS_TAG: Record<ProjectStatus, 'info' | 'primary' | 'success' | 'warning'> = {
  规划中: 'info',
  进行中: 'primary',
  已完成: 'success',
  已搁置: 'warning',
}
