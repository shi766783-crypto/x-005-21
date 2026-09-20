import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { title: '首页' } },
  { path: '/tools', name: 'tools', component: () => import('../views/ToolsView.vue'), meta: { title: '工具库存' } },
  { path: '/materials', name: 'materials', component: () => import('../views/MaterialsView.vue'), meta: { title: '材料库存' } },
  { path: '/projects', name: 'projects', component: () => import('../views/ProjectsView.vue'), meta: { title: 'DIY 项目' } },
  { path: '/projects/:id', name: 'project-detail', component: () => import('../views/ProjectDetailView.vue'), meta: { title: '项目详情' } },
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: '数据看板' } },
  { path: '/leaderboard', name: 'leaderboard', component: () => import('../views/LeaderboardView.vue'), meta: { title: '排行榜' } },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { title: '个人中心' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 家庭 DIY 管家` : '家庭 DIY 管家'
})

export default router
