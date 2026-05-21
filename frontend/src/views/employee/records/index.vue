<template>
  <div class="records-page">
    <h2 style="margin-bottom:20px">我的学习记录</h2>

    <div v-if="records.length === 0" style="text-align:center;padding:60px 0;color:#909399">
      暂无学习记录
    </div>

    <el-card v-for="rec in records" :key="rec.courseId" shadow="never" class="record-card">
      <div class="record-header">
        <div>
          <h3>{{ rec.courseName }}</h3>
          <span class="record-category">{{ rec.category || '未分类' }}</span>
        </div>
        <el-tag :type="rec.isCompleted ? 'success' : 'warning'" size="small">
          {{ rec.isCompleted ? '已完成' : '学习中' }}
        </el-tag>
      </div>

      <div class="record-stats">
        <div class="stat-item">
          <span class="stat-label">学习时长</span>
          <span class="stat-value">{{ formatDuration(rec.totalDuration) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">进度</span>
          <span class="stat-value">{{ rec.isCompleted ? '100%' : rec.videoDuration ? Math.round((rec.currentProgress / rec.videoDuration) * 100) + '%' : '-' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">开始时间</span>
          <span class="stat-value">{{ formatTime(rec.startTime) }}</span>
        </div>
        <div class="stat-item" v-if="rec.completedAt">
          <span class="stat-label">完成时间</span>
          <span class="stat-value">{{ formatTime(rec.completedAt) }}</span>
        </div>
      </div>

      <!-- 考试记录 -->
      <div v-if="rec.exams && rec.exams.length > 0" class="exam-records">
        <p class="exam-title">考试记录：</p>
        <div v-for="(exam, idx) in rec.exams" :key="idx" class="exam-item">
          <span>第 {{ exam.attemptNumber }} 次考试</span>
          <el-tag :type="exam.isPassed ? 'success' : 'danger'" size="small">
            {{ exam.isPassed ? '通过' : '未通过' }}
          </el-tag>
          <span>{{ exam.score }}分</span>
          <span style="color:#909399;font-size:12px">{{ formatTime(exam.examTime) }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getMyRecords } from '../../../api/employee-api';

const records = ref<any[]>([]);

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

onMounted(async () => {
  try {
    const result = await getMyRecords();
    records.value = result || [];
    // 获取视频时长信息（从课程列表补充）
    try {
      const { getMyCourses } = await import('../../../api/employee-api');
      const courses = await getMyCourses();
      const durationMap = new Map(courses.map((c: any) => [c.courseId, c.videoDuration]));
      records.value = records.value.map((r: any) => ({
        ...r,
        videoDuration: durationMap.get(r.courseId) || 0,
      }));
    } catch {
      // ignore
    }
  } catch {
    // handled
  }
});
</script>

<style scoped lang="scss">
.records-page {
  max-width: 900px;
  margin: 0 auto;
}

.record-card {
  margin-bottom: 16px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;

  h3 { font-size: 16px; color: #303133; }
  .record-category { font-size: 13px; color: #909399; }
}

.record-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.exam-records {
  border-top: 1px solid #e4e7ed;
  padding-top: 12px;
}

.exam-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.exam-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  margin-bottom: 4px;
}
</style>
