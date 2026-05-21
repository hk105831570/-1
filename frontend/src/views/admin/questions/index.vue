<template>
  <div class="questions-page">
    <el-card shadow="never">
      <!-- 课程选择 -->
      <div class="course-select-bar">
        <span style="margin-right:12px">选择课程：</span>
        <el-select v-model="currentCourseId" placeholder="请选择课程" style="width:300px" @change="handleCourseChange">
          <el-option v-for="c in courses" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button type="primary" style="margin-left:16px" :disabled="!currentCourseId" @click="showAddDialog">新增题目</el-button>
      </div>

      <el-table :data="questions" v-loading="loading" stripe v-if="currentCourseId">
        <el-table-column label="排序" width="60" prop="sortOrder" />
        <el-table-column label="题型" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ typeLabel(row.questionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="题干" min-width="300">
          <template #default="{ row }">{{ row.title }}</template>
        </el-table-column>
        <el-table-column label="正确答案" width="120">
          <template #default="{ row }">{{ row.answer }}</template>
        </el-table-column>
        <el-table-column label="分值" width="60" prop="score" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!currentCourseId" style="text-align:center;padding:60px 0;color:#909399">
        请先选择课程
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEditing ? '编辑题目' : '新增题目'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="题型" prop="questionType">
          <el-radio-group v-model="form.questionType">
            <el-radio value="single">单选题</el-radio>
            <el-radio value="multiple">多选题</el-radio>
            <el-radio value="judge">判断题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="题干" prop="title">
          <el-input v-model="form.title" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>
        <el-form-item label="选项" prop="options" v-if="form.questionType !== 'judge'">
          <div class="options-list">
            <div v-for="(opt, idx) in form.options" :key="idx" class="option-item">
              <span class="option-label">{{ String.fromCharCode(65 + idx) }}.</span>
              <el-input v-model="form.options[idx]" placeholder="选项内容" style="flex:1" />
              <el-button v-if="form.options.length > 2" text type="danger" @click="removeOption(idx)">删除</el-button>
            </div>
            <el-button size="small" @click="addOption">+ 添加选项</el-button>
          </div>
        </el-form-item>
        <el-form-item label="正确答案" prop="answer">
          <template v-if="form.questionType === 'judge'">
            <el-radio-group v-model="form.answer">
              <el-radio value="A">正确</el-radio>
              <el-radio value="B">错误</el-radio>
            </el-radio-group>
          </template>
          <template v-else-if="form.questionType === 'single'">
            <el-radio-group v-model="form.answer">
              <el-radio v-for="(opt, idx) in form.options" :key="idx" :value="String.fromCharCode(65 + idx)">
                {{ String.fromCharCode(65 + idx) }}
              </el-radio>
            </el-radio-group>
          </template>
          <template v-else>
            <el-checkbox-group v-model="multipleAnswer">
              <el-checkbox v-for="(opt, idx) in form.options" :key="idx" :value="String.fromCharCode(65 + idx)" :label="String.fromCharCode(65 + idx)">
                {{ String.fromCharCode(65 + idx) }}
              </el-checkbox>
            </el-checkbox-group>
          </template>
        </el-form-item>
        <el-form-item label="分值" prop="score">
          <el-input-number v-model="form.score" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../../api/question';
import { getCourses } from '../../../api/course';

const currentCourseId = ref<number | null>(null);
const courses = ref<any[]>([]);
const questions = ref<any[]>([]);
const loading = ref(false);

const multipleAnswer = ref<string[]>([]);

async function loadCourses() {
  const result = await getCourses({ pageSize: 200 });
  courses.value = result.items;
}

async function loadQuestions() {
  if (!currentCourseId.value) return;
  loading.value = true;
  try {
    const result = await getQuestions({ courseId: currentCourseId.value, pageSize: 200 });
    questions.value = result.items;
  } finally {
    loading.value = false;
  }
}

function handleCourseChange() {
  loadQuestions();
}

function typeLabel(type: string) {
  const map: Record<string, string> = { single: '单选', multiple: '多选', judge: '判断' };
  return map[type] || type;
}

// 新增/编辑
const formVisible = ref(false);
const isEditing = ref(false);
const editingId = ref(0);
const submitting = ref(false);
const formRef = ref<any>(null);

const form = reactive({
  questionType: 'single',
  title: '',
  options: ['', ''],
  answer: '',
  score: 10,
  sortOrder: 0,
});

const formRules = {
  questionType: [{ required: true, message: '请选择题型', trigger: 'change' }],
  title: [{ required: true, message: '请输入题干', trigger: 'blur' }],
  answer: [{ required: true, message: '请选择正确答案', trigger: 'change' }],
  score: [{ required: true, message: '请输入分值', trigger: 'blur' }],
};

function addOption() {
  form.options.push('');
}

function removeOption(idx: number) {
  form.options.splice(idx, 1);
}

// 监听多选题答案变化
watch(multipleAnswer, (val) => {
  form.answer = val.sort().join(',');
});

function showAddDialog() {
  isEditing.value = false;
  editingId.value = 0;
  form.questionType = 'single';
  form.title = '';
  form.options = ['', ''];
  form.answer = '';
  form.score = 10;
  form.sortOrder = 0;
  multipleAnswer.value = [];
  formVisible.value = true;
}

function showEdit(row: any) {
  isEditing.value = true;
  editingId.value = row.id;
  form.questionType = row.questionType;
  form.title = row.title;
  form.options = Array.isArray(row.options) ? [...row.options] : ['', ''];
  form.score = row.score;
  form.sortOrder = row.sortOrder;

  if (row.questionType === 'multiple') {
    multipleAnswer.value = row.answer.split(',').sort();
  } else {
    multipleAnswer.value = [];
  }
  form.answer = row.answer;
  formVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const data = {
      courseId: currentCourseId.value,
      questionType: form.questionType,
      title: form.title,
      options: form.options.filter(Boolean),
      answer: form.answer,
      score: form.score,
      sortOrder: form.sortOrder,
    };

    if (isEditing.value) {
      await updateQuestion(editingId.value, data);
      ElMessage.success('编辑成功');
    } else {
      await createQuestion(data);
      ElMessage.success('新增成功');
    }

    formVisible.value = false;
    loadQuestions();
  } catch {
    // handled
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确认删除该题目？', '提示');
    await deleteQuestion(row.id);
    ElMessage.success('已删除');
    loadQuestions();
  } catch {
    // canceled
  }
}

onMounted(() => {
  loadCourses();
});
</script>

<style scoped lang="scss">
.questions-page {
  .course-select-bar {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 14px;
    color: #303133;
  }
}
.options-list {
  width: 100%;
}
.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.option-label {
  font-weight: 600;
  width: 20px;
  color: #606266;
}
</style>
