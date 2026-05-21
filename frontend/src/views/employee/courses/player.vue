<template>
  <div class="player-page" v-loading="loading">
    <div v-if="!course" style="text-align:center;padding:60px;color:#909399">课程不存在</div>

    <template v-if="course">
      <el-card shadow="never" class="video-card">
        <video
          v-if="course.videoUrl"
          ref="videoRef"
          :src="getVideoSrc(course.videoUrl)"
          controls
          controlsList="nodownload noremoteplaytube noplaybackrate"
          disablePictureInPicture
          class="video-player"
          @play="onPlay"
          @pause="onPause"
          @timeupdate="onTimeUpdate"
          @seeked="onSeeked"
          @ratechange="onRateChange"
          @ended="onEnded"
          @loadedmetadata="onLoadedMetadata"
        />
        <div v-else class="no-video">
          <el-icon :size="48"><VideoCamera /></el-icon>
          <p>该课程暂无视频</p>
        </div>
        <p class="video-tip">请完整观看视频，完成后可参加考试（不能拖动快进）</p>
      </el-card>

      <el-card shadow="never" class="info-card">
        <div class="info-header">
          <h2>{{ course.courseName }}</h2>
          <el-tag :type="course.status === 'completed' ? 'success' : 'warning'" size="small">
            {{ course.status === 'completed' ? '已完成' : course.status === 'learning' ? '学习中' : '未开始' }}
          </el-tag>
        </div>

        <div class="info-meta">
          <span>分类：{{ course.category || '未分类' }}</span>
          <span>视频时长：{{ formatDuration(actualDuration || course.videoDuration) }}</span>
          <span>通过分数：{{ course.passingScore }}分</span>
        </div>

        <el-progress
          :percentage="Math.min(progressPercent, 100)"
          :status="course.status === 'completed' ? 'success' : undefined"
          class="progress-bar"
        />

        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            :disabled="!canExam"
            @click="goExam"
          >
            {{ canExam ? '开始考试' : '请先完成视频学习' }}
          </el-button>
        </div>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { VideoCamera } from '@element-plus/icons-vue';
import { getMyCourses, updateProgress } from '../../../api/employee-api';
import { withBasePath } from '../../../utils/base-path';

const route = useRoute();
const router = useRouter();
const courseId = Number(route.params.id);

const loading = ref(false);
const course = ref<any>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const lastReportTime = ref(0);
const maxProgress = ref(0); // 已观看的最大进度（秒），防止快进
const actualDuration = ref(0); // 视频实际时长（从 loadedmetadata 获取）
const isResetting = ref(false); // 防止 seeking 事件循环

// 使用的总时长：优先用 HTML5 视频实际时长，其次用后端存储值
const totalDuration = computed(() => {
  return actualDuration.value || course.value?.videoDuration || 0;
});

const progressPercent = computed(() => {
  const dur = totalDuration.value;
  if (!dur) return 0;
  return Math.round((course.value?.progress || 0) / dur * 100);
});

const canExam = computed(() => course.value?.status === 'completed');

function formatDuration(seconds: number) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getVideoSrc(url: string) {
  return withBasePath(url);
}

// 每10秒上报一次进度
let progressTimer: any = null;
const REPORT_INTERVAL = 10;

// 获取视频实际元数据
function onLoadedMetadata() {
  if (!videoRef.value) return;
  const dur = videoRef.value.duration;
  if (dur && isFinite(dur) && dur > 0) {
    actualDuration.value = dur;
  }
}

function onPlay() {
  isPlaying.value = true;
  startProgressReport();
}

function onPause() {
  isPlaying.value = false;
  stopProgressReport();
}

// 阻止速度调整
function onRateChange() {
  if (videoRef.value && Math.abs(videoRef.value.playbackRate - 1) > 0.01) {
    videoRef.value.playbackRate = 1;
  }
}

// 禁止拖动快进
function onSeeked() {
  if (isResetting.value || !videoRef.value) return;
  const newTime = videoRef.value.currentTime;
  if (newTime > maxProgress.value + 1) {
    isResetting.value = true;
    videoRef.value.currentTime = maxProgress.value;
  }
  setTimeout(() => { isResetting.value = false; }, 200);
}

function onTimeUpdate() {
  if (!videoRef.value || !course.value) return;
  const currentTime = videoRef.value.currentTime;
  if (currentTime > maxProgress.value) {
    maxProgress.value = currentTime;
  }
  course.value.progress = maxProgress.value;
}

// 视频播放完毕
function onEnded() {
  if (!videoRef.value) return;
  const dur = totalDuration.value || videoRef.value.duration || 0;
  if (dur > 0) {
    maxProgress.value = dur;
    course.value.progress = dur;
  }
  isPlaying.value = false;
  stopProgressReport();
  reportProgress(true);
}

async function reportProgress(isEnded = false) {
  if (!course.value) return;
  const dur = totalDuration.value;
  if (dur <= 0) return;

  const currentTime = isEnded ? dur : maxProgress.value;
  if (currentTime <= lastReportTime.value && !isEnded) return;

  const increment = Math.round(Math.max(0, currentTime - lastReportTime.value));
  // 确保进度不超过实际时长
  const cappedProgress = Math.min(currentTime, dur);

  try {
    const payload: any = {
      courseId: course.value.courseId,
      increment,
      currentProgress: Math.round(cappedProgress),
    };

    // 如果 HTML5 获取到实际时长，传给后端用于更新
    if (actualDuration.value > 0) {
      payload.videoDuration = Math.round(actualDuration.value);
    }

    await updateProgress(payload);
    lastReportTime.value = currentTime;
    course.value.progress = cappedProgress;

    // 检查是否看完
    if (cappedProgress >= dur) {
      course.value.status = 'completed';
      // 刷新课程状态
      try {
        const courses = await getMyCourses();
        const updated = courses.find((c: any) => c.courseId === courseId);
        if (updated) {
          course.value = { ...course.value, ...updated, progress: Math.min(cappedProgress, dur) };
        }
      } catch { /* ignore */ }
    }
  } catch { /* 上报失败不阻塞播放 */ }
}

function startProgressReport() {
  lastReportTime.value = maxProgress.value;
  progressTimer = setInterval(() => reportProgress(), REPORT_INTERVAL * 1000);
}

function stopProgressReport() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  reportProgress();
}

function goExam() {
  router.push(`/course/${courseId}/exam`);
}

onMounted(async () => {
  loading.value = true;
  try {
    const courses = await getMyCourses();
    course.value = courses.find((c: any) => c.courseId === courseId) || null;

    // 初始化最大进度，不超过实际时长
    if (course.value) {
      const dur = course.value.videoDuration || 0;
      maxProgress.value = Math.min(course.value.progress || 0, dur);
      course.value.progress = maxProgress.value;
    }

    if (!course.value) {
      ElMessage.error('课程不存在或无权限');
    }
  } catch { /* handled */ } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  stopProgressReport();
});
</script>

<style scoped lang="scss">
.player-page {
  max-width: 1000px;
  margin: 0 auto;
}

.video-card {
  margin-bottom: 16px;
}

.video-player {
  width: 100%;
  max-height: 560px;
  background: #000;
  border-radius: 4px;
}

.no-video {
  text-align: center;
  padding: 80px 0;
  color: #909399;
}

.video-tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  margin-top: 8px;
}

.info-card {
  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h2 {
      font-size: 20px;
      color: #303133;
    }
  }

  .info-meta {
    display: flex;
    gap: 24px;
    color: #606266;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .progress-bar {
    margin-bottom: 24px;
  }

  .action-buttons {
    text-align: center;
  }
}
</style>
