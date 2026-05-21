<template>
  <router-view />
</template>

<script setup lang="ts">
import { clearStorage } from './utils/storage';

// 新窗口/页面加载时清空旧缓存，确保每次新开窗口都显示登录页
// SPA 内部导航（router.push）不会触发此逻辑
if (!sessionStorage.getItem('app_initialized')) {
  clearStorage();
  sessionStorage.setItem('app_initialized', 'true');
}
</script>
