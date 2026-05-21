<template>
  <div class="my-courses-page">
    <h2 style="margin-bottom:20px">我的课程</h2>

    <!-- Tab 分类 -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="未开始" name="not_started" />
      <el-tab-pane label="学习中" name="learning" />
      <el-tab-pane label="已完成" name="completed" />
    </el-tabs>

    <div v-if="filteredCourses.length === 0" style="text-align:center;padding:60px 0;color:#909399">
      {{ activeTab === 'all' ? '暂无可学课程，请联系HR配置岗位课程' : '暂无此类课程' }}
    </div>

    <el-row :gutter="16">
      <el-col v-for="item in filteredCourses" :key="item.courseId" :xs="24" :sm="12" :md="8" :lg="6" style="margin-bottom:16px">
        <el-card shadow="hover" class="course-card" @click="goCourse(item)">
          <div class="course-status" :class="item.status">
            {{ statusLabel(item.status) }}
          </div>
          <h3 class="course-name">{{ item.courseName }}</h3>
          <p class="course-meta">
            <span>{{ item.category || '未分类' }}</span>
            <span v-if="item.isRequired" class="required-tag">必修</span>
          </p>
          <div v-if="item.videoDuration" class="course-duration">
            时长: {{ formatDuration(item.videoDuration) }}
          </div>
          <el-progress
            v-if="item.status !== 'not_started'"
            :percentage="Math.min(Math.round((item.progress / (item.videoDuration || 1)) * 100), 100)"
            :status="item.status === 'completed' ? 'success' : undefined"
            :stroke-width="6"
          />
          <div v-if="item.examScore" class="exam-score">
            考试：{{ item.examScore.score }}分
            <el-tag :type="item.examScore.isPassed ? 'success' : 'danger'" size="small">
              {{ item.examScore.isPassed ? '通过' : '未通过' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getMyCourses } from '../../../api/employee-api';

const router = useRouter();
const courses = ref<any[]>([]);
const activeTab = ref('all');
const filteredCourses = computed(() => {
  if (activeTab.value === 'all') return courses.value;
  return courses.value.filter((c) => c.status === activeTab.value);
});

function statusLabel(status: string) {
  const map: Record<string, string> = { not_started: '未开始', learning: '学习中', completed: '已完成' };
  return map[status] || status;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

function goCourse(item: any) {
  if (item.status === 'completed') {
    // 已完成可以查看考试结果或回顾
    router.push(`/course/${item.courseId}`);
  } else {
    router.push(`/course/${item.courseId}`);
  }
}

onMounted(async () => {
  try {
    const result = await getMyCourses();
    courses.value = result || [];
  } catch {
    // handled
  }
});
</script>

<style scoped lang="scss">
.my-courses-page {
  max-width: 1200px;
  margin: 0 auto;
}

.course-card {
  cursor: pointer;
  position: relative;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
}

.course-status {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;

  &.not_started {
    background: #ecf5ff;
    color: #409eff;
  }
  &.learning {
    background: #fdf6ec;
    color: #e6a23c;
  }
  &.completed {
    background: #f0f9eb;
    color: #67c23a;
  }
}

.course-name {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
  padding-right: 50px;
}

.course-meta {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;

  .required-tag {
    color: #f56c6c;
    margin-left: 8px;
  }
}

.course-duration {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.exam-score {
  font-size: 13px;
  color: #303133;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
