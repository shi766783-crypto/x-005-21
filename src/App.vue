<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => {
  const name = route.name as string
  if (name === 'project-detail') return 'projects'
  return name
})
</script>

<template>
  <el-container class="app-shell">
    <el-aside width="220px" class="app-aside">
      <div class="logo">
        <el-icon size="24"><Tools /></el-icon>
        <span>家庭 DIY 管家</span>
      </div>
      <el-menu :default-active="activeMenu" router class="app-menu">
        <el-menu-item index="home" :route="{ name: 'home' }">
          <el-icon><HomeFilled /></el-icon><span>首页</span>
        </el-menu-item>
        <el-menu-item index="tools" :route="{ name: 'tools' }">
          <el-icon><Suitcase /></el-icon><span>工具库存</span>
        </el-menu-item>
        <el-menu-item index="materials" :route="{ name: 'materials' }">
          <el-icon><Box /></el-icon><span>材料库存</span>
        </el-menu-item>
        <el-menu-item index="projects" :route="{ name: 'projects' }">
          <el-icon><Notebook /></el-icon><span>DIY 项目</span>
        </el-menu-item>
        <el-menu-item index="dashboard" :route="{ name: 'dashboard' }">
          <el-icon><DataAnalysis /></el-icon><span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="leaderboard" :route="{ name: 'leaderboard' }">
          <el-icon><Trophy /></el-icon><span>排行榜</span>
        </el-menu-item>
        <el-menu-item index="profile" :route="{ name: 'profile' }">
          <el-icon><User /></el-icon><span>个人中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<style scoped>
.app-shell {
  height: 100%;
}

.app-aside {
  background: #fff;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 60px;
  padding: 0 20px;
  font-weight: 600;
  font-size: 16px;
  color: var(--brand);
  border-bottom: 1px solid var(--border);
}

.app-menu {
  border-right: none;
  flex: 1;
}

.app-main {
  background: var(--page-bg);
  padding: 0;
  overflow-y: auto;
}
</style>
