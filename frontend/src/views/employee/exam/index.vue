<template>
  <div class="exam-page" v-loading="loading">
    <div v-if="errorMsg" style="text-align:center;padding:60px;color:#909399">
      <p>{{ errorMsg }}</p>
      <el-button style="margin-top:16px" @click="router.back()">返回课程</el-button>
    </div>

    <div v-if="submitted">
      <el-card shadow="never" class="result-card">
        <div class="result-header" :class="result.isPassed ? 'pass' : 'fail'">
          <el-icon :size="48">
            <component :is="result.isPassed ? 'CircleCheck' : 'CircleClose'" />
          </el-icon>
          <h2>{{ result.isPassed ? '恭喜通过！' : '未通过' }}</h2>
          <p class="result-score">
            {{ result.score }} / {{ result.passingScore }} 分
          </p>
          <p class="result-detail">
            共 {{ result.totalQuestions }} 题，第 {{ result.attemptNumber }} 次考试
          </p>
          <div class="result-actions">
            <el-button v-if="!result.isPassed" type="primary" @click="startExam">重新考试</el-button>
            <el-button @click="router.push('/')">返回课程列表</el-button>
          </div>
        </div>
      </el-card>

      <!-- 答题详情 -->
      <el-card shadow="never" class="detail-card" v-if="result.answerDetails">
        <h3>答题详情</h3>
        <div v-for="(item, idx) in result.answerDetails" :key="idx" class="answer-item" :class="{ correct: item.isCorrect, wrong: !item.isCorrect }">
          <div class="question-title">
            <span class="q-number">{{ Number(idx) + 1 }}.</span>
            <span>{{ item.title }}</span>
            <el-tag :type="item.isCorrect ? 'success' : 'danger'" size="small" style="margin-left:8px">
              {{ item.isCorrect ? '+'+String(Number(item.earnedScore)) : '0' }}/{{ Number(item.score) }}分
            </el-tag>
          </div>
          <div class="answer-row">
            <span class="label">你的答案：</span>
            <span :class="item.isCorrect ? 'correct-text' : 'wrong-text'">{{ item.userAnswer || '未作答' }}</span>
          </div>
          <div v-if="!item.isCorrect" class="answer-row">
            <span class="label">正确答案：</span>
            <span class="correct-text">{{ item.correctAnswer }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="!submitted && !errorMsg && questions.length > 0">
      <el-card shadow="never">
        <div class="exam-header">
          <h2>课程考试：{{ courseName }}</h2>
          <p class="exam-tip">共 {{ questions.length }} 题，总分 {{ totalExamScore }} 分，{{ passingScore }} 分及格</p>
        </div>

        <div v-for="(q, idx) in questions" :key="q.id" class="question-block">
          <div class="question-title">
            <span class="q-number">{{ Number(idx) + 1 }}.</span>
            <el-tag size="small" type="info">{{ typeLabel(q.questionType) }}</el-tag>
            <span style="margin-left:8px">{{ q.title }}</span>
            <span style="margin-left:auto;color:#909399;font-size:13px">{{ q.score }}分</span>
          </div>

          <!-- 单选题 -->
          <el-radio-group v-if="q.questionType === 'single'" v-model="answers[q.id]" class="options-group">
            <el-radio v-for="(opt, oi) in q.options" :key="oi" :value="String.fromCharCode(65 + Number(oi))" class="option-item">
              {{ String.fromCharCode(65 + Number(oi)) }}. {{ opt }}
            </el-radio>
          </el-radio-group>

          <!-- 多选题 -->
          <el-checkbox-group v-if="q.questionType === 'multiple'" v-model="multipleAnswers[q.id]" class="options-group">
            <el-checkbox v-for="(opt, oi) in q.options" :key="oi" :value="String.fromCharCode(65 + Number(oi))" class="option-item">
              {{ String.fromCharCode(65 + Number(oi)) }}. {{ opt }}
            </el-checkbox>
          </el-checkbox-group>

          <!-- 判断题 -->
          <el-radio-group v-if="q.questionType === 'judge'" v-model="answers[q.id]" class="options-group">
            <el-radio value="A" class="option-item">A. 正确</el-radio>
            <el-radio value="B" class="option-item">B. 错误</el-radio>
          </el-radio-group>
        </div>

        <div class="submit-area">
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            提交答卷
          </el-button>
          <span v-if="unansweredCount > 0" style="color:#e6a23c;margin-left:12px">
            还有 {{ unansweredCount }} 题未作答
          </span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getExamQuestions, submitExam } from '../../../api/employee-api';

const route = useRoute();
const router = useRouter();
const courseId = Number(route.params.id);

const loading = ref(false);
const submitting = ref(false);
const questions = ref<any[]>([]);
const courseName = ref('');
const passingScore = ref(80);
const errorMsg = ref('');

const answers = reactive<Record<number, string>>({});
const multipleAnswers = reactive<Record<number, string[]>>({});

const submitted = ref(false);
const result = ref<any>(null);

const totalExamScore = computed(() => questions.value.reduce((s: number, q: any) => s + Number(q.score), 0));
const unansweredCount = computed(() => {
  let count = 0;
  for (const q of questions.value) {
    if (q.questionType === 'multiple') {
      if (!multipleAnswers[q.id] || multipleAnswers[q.id].length === 0) count++;
    } else {
      if (!answers[q.id]) count++;
    }
  }
  return count;
});

function typeLabel(type: string) {
  const map: Record<string, string> = { single: '单选', multiple: '多选', judge: '判断' };
  return map[type] || type;
}

async function startExam() {
  submitted.value = false;
  result.value = null;
  loading.value = true;
  errorMsg.value = '';
  try {
    const data: any = await getExamQuestions(courseId);
    questions.value = data || [];
    if (questions.value.length === 0) {
      errorMsg.value = '该课程暂无考题，请联系HR配置';
    }
    // 从路由查询中获取课程名
    courseName.value = (route.query.name as string) || '课程考试';
    passingScore.value = Number(route.query.passingScore) || 80;

    // 初始化答案
    for (const q of questions.value) {
      answers[q.id] = '';
      multipleAnswers[q.id] = [];
    }
  } catch (err: any) {
    errorMsg.value = err?.message || '获取考试失败';
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (unansweredCount.value > 0) {
    try {
      await ElMessageBox.confirm(
        `还有 ${unansweredCount.value} 题未作答，确定提交吗？`,
        '提示',
      );
    } catch {
      return;
    }
  }

  submitting.value = true;
  try {
    const answerList = [];
    for (const q of questions.value) {
      let answer = '';
      if (q.questionType === 'multiple') {
        answer = (multipleAnswers[q.id] || []).sort().join(',');
      } else {
        answer = answers[q.id] || '';
      }
      answerList.push({ questionId: q.id, answer });
    }

    const data: any = await submitExam({ courseId, answers: answerList });
    result.value = data;
    submitted.value = true;
  } catch {
    // handled
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  startExam();
});
</script>

<style scoped lang="scss">
.exam-page {
  max-width: 800px;
  margin: 0 auto;
}

.exam-header {
  margin-bottom: 24px;
  h2 { font-size: 20px; color: #303133; }
  .exam-tip { color: #909399; font-size: 13px; margin-top: 4px; }
}

.question-block {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;

  .question-title {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    font-size: 15px;
    color: #303133;
  }

  .q-number {
    font-weight: 600;
    margin-right: 4px;
  }

  .options-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .option-item {
    margin: 4px 0;
  }
}

.submit-area {
  text-align: center;
  margin-top: 24px;
  padding: 20px;
}

// 结果页
.result-card {
  margin-bottom: 16px;
}

.result-header {
  text-align: center;
  padding: 40px 0;

  &.pass {
    color: #67c23a;
  }
  &.fail {
    color: #f56c6c;
  }

  h2 { margin-top: 12px; font-size: 24px; }
}

.result-score {
  font-size: 36px;
  font-weight: 700;
  color: #303133;
  margin-top: 8px;
}

.result-detail {
  color: #909399;
  margin-top: 4px;
}

.result-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.detail-card {
  h3 { margin-bottom: 16px; }
}

.answer-item {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 8px;

  &.correct { background: #f0f9eb; }
  &.wrong { background: #fef0f0; }

  .question-title {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .q-number { font-weight: 600; margin-right: 4px; }
  .label { color: #909399; margin-right: 4px; }
  .correct-text { color: #67c23a; }
  .wrong-text { color: #f56c6c; }
  .answer-row { font-size: 13px; margin-bottom: 4px; }
}
</style>
