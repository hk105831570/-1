<template>
  <div class="layout-default">
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <router-link to="/" class="header-title">企业员工培训系统</router-link>
          <el-menu mode="horizontal" :ellipsis="false" router class="nav-menu" :default-active="route.path">
            <el-menu-item index="/">我的课程</el-menu-item>
            <el-menu-item index="/records">学习记录</el-menu-item>
          </el-menu>
        </div>
        <div class="header-right">
          <span class="header-user">{{ userStore.user?.name }}</span>
          <el-button text @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const userStore = useAuthStore();

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<style scoped lang="scss">
.layout-default {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  text-decoration: none;
}

.nav-menu {
  flex: 1;
  border-bottom: none !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-user {
  color: #606266;
  font-size: 14px;
}

.layout-main {
  flex: 1;
  background: #f5f7fa;
  overflow-y: auto;
  padding: 24px;
}
</style>
