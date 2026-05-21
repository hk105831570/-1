<template>
  <div class="records-page">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="query" inline>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="员工姓名/工号" clearable style="width:180px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="query.department" placeholder="全部部门" clearable style="width:150px" @change="handleSearch">
            <el-option v-for="d in departments" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="完成状态">
          <el-select v-model="query.isCompleted" placeholder="全部" clearable style="width:120px" @change="handleSearch">
            <el-option label="已完成" :value="true" />
            <el-option label="学习中" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table :data="records" v-loading="loading" stripe style="width:100%">
        <el-table-column label="工号" prop="employeeId" width="120" />
        <el-table-column label="姓名" prop="employeeName" width="100" />
        <el-table-column label="部门" prop="department" width="120" />
        <el-table-column label="岗位" prop="position" width="120" />
        <el-table-column label="课程" prop="courseName" min-width="160" />
        <el-table-column label="学习进度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.videoDuration ? Math.min(Math.round(row.currentProgress / row.videoDuration * 100), 100) : 0"
              :status="row.isCompleted ? 'success' : undefined"
              :stroke-width="8"
              style="width:100px"
            />
          </template>
        </el-table-column>
        <el-table-column label="学习时长" width="100">
          <template #default="{ row }">
            {{ formatDuration(row.totalDuration) }}
          </template>
        </el-table-column>
        <el-table-column label="考试分数" width="100">
          <template #default="{ row }">
            <span v-if="row.exam" :style="{ color: row.exam.isPassed ? '#67c23a' : '#f56c6c', fontWeight: 600 }">
              {{ row.exam.score }}分
            </span>
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="考试结果" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.exam" :type="row.exam.isPassed ? 'success' : 'danger'" size="small">
              {{ row.exam.isPassed ? '通过' : '未过' }}
            </el-tag>
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="160">
          <template #default="{ row }">
            {{ row.completedAt ? formatTime(row.completedAt) : '-' }}
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;text-align:right">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { getStudyRecords } from '../../../api/study-record';

const loading = ref(false);
const records = ref<any[]>([]);
const total = ref(0);
const departments = ref<string[]>([]);

const query = reactive({
  keyword: '',
  department: '' as string | undefined,
  isCompleted: undefined as boolean | undefined,
  page: 1,
  pageSize: 20,
});

function formatDuration(seconds: number) {
  if (!seconds) return '0分';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时${m}分`;
  return `${m}分`;
}

function formatTime(time: string) {
  if (!time) return '-';
  return time.substring(0, 16).replace('T', ' ');
}

async function loadRecords() {
  loading.value = true;
  try {
    const params: any = { page: query.page, pageSize: query.pageSize };
    if (query.keyword) params.keyword = query.keyword;
    if (query.department) params.department = query.department;
    if (query.isCompleted !== undefined) params.isCompleted = query.isCompleted;

    const result = await getStudyRecords(params);
    records.value = result.items || [];
    total.value = result.total || 0;
    if (result.departments) {
      departments.value = result.departments;
    }
  } catch {
    records.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadRecords();
}

function handleReset() {
  query.keyword = '';
  query.department = '';
  query.isCompleted = undefined;
  query.page = 1;
  loadRecords();
}

onMounted(() => {
  loadRecords();
});
</script>

<style scoped lang="scss">
.records-page {
  .search-card {
    margin-bottom: 16px;
  }
}
</style>
