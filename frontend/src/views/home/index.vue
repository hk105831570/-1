<template>
  <div class="home-page">
    <h1>欢迎使用企业员工培训系统</h1>
    <p>当前用户：{{ userStore.user?.name }}</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';

const userStore = useAuthStore();
</script>

<style scoped lang="scss">
.home-page {
  padding: 40px;

  h1 {
    color: #303133;
    margin-bottom: 16px;
  }

  p {
    color: #606266;
    font-size: 16px;
  }
}
</style>
