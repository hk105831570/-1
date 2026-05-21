<template>
  <div class="courses-page">
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">课程列表</div>
        <el-button type="primary" @click="showAddDialog">新增课程</el-button>
      </div>

      <el-table :data="courses" v-loading="loading" stripe>
        <el-table-column prop="name" label="课程名" min-width="180" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="version" label="版本" width="70" />
        <el-table-column prop="videoDuration" label="时长" width="100">
          <template #default="{ row }">
            {{ row.videoDuration ? formatDuration(row.videoDuration) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="passingScore" label="分数线" width="80" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">
              {{ row.isActive ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showEdit(row)">编辑</el-button>
            <el-button link :type="row.isActive ? 'warning' : 'success'" size="small" @click="handleToggle(row)">
              {{ row.isActive ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadCourses"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEditing ? '编辑课程' : '新增课程'"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="课程名" prop="name">
          <el-input v-model="form.name" placeholder="请输入课程名" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="form.category" placeholder="请输入分类" />
        </el-form-item>
        <el-form-item label="通过分数线" prop="passingScore">
          <el-input-number v-model="form.passingScore" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="上传视频">
          <el-upload
            :auto-upload="false"
            accept="video/*"
            :limit="1"
            :on-change="handleVideoChange"
            :file-list="videoFileList"
          >
            <el-button type="primary" plain>选择视频文件</el-button>
            <template #tip>
              <span style="font-size:12px;color:#909399">支持 mp4/webm/avi/mov/mkv，最大 500MB</span>
            </template>
          </el-upload>
          <div v-if="form.videoUrl && !videoFile" style="margin-top:8px">
            <span style="color:#606266">当前视频: {{ form.videoUrl }}</span>
          </div>
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getCourses, createCourse, updateCourse, uploadVideo } from '../../../api/course';
import type { CourseItem } from '../../../api/course';
import type { UploadFile } from 'element-plus';

const loading = ref(false);
const courses = ref<CourseItem[]>([]);
const total = ref(0);

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
});

async function loadCourses() {
  loading.value = true;
  try {
    const result = await getCourses(query);
    courses.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// 新增/编辑
const formVisible = ref(false);
const isEditing = ref(false);
const editingId = ref(0);
const submitting = ref(false);
const formRef = ref<any>(null);

const form = reactive({
  name: '',
  category: '',
  passingScore: 80,
  videoUrl: '',
  videoDuration: 0,
});

const formRules = {
  name: [{ required: true, message: '请输入课程名', trigger: 'blur' }],
};

const videoFile = ref<File | null>(null);
const videoFileList = ref<any[]>([]);

function showAddDialog() {
  isEditing.value = false;
  editingId.value = 0;
  form.name = '';
  form.category = '';
  form.passingScore = 80;
  form.videoUrl = '';
  form.videoDuration = 0;
  videoFile.value = null;
  videoFileList.value = [];
  formVisible.value = true;
}

function showEdit(row: CourseItem) {
  isEditing.value = true;
  editingId.value = row.id;
  form.name = row.name;
  form.category = row.category || '';
  form.passingScore = row.passingScore;
  form.videoUrl = row.videoUrl || '';
  form.videoDuration = row.videoDuration || 0;
  videoFile.value = null;
  videoFileList.value = [];
  formVisible.value = true;
}

function handleVideoChange(uploadFile: UploadFile) {
  if (uploadFile.raw) {
    videoFile.value = uploadFile.raw;
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const data: any = {
      name: form.name,
      category: form.category || undefined,
      passingScore: form.passingScore,
    };

    // 先上传视频（如果有新文件）
    if (videoFile.value) {
      const uploadResult: any = await uploadVideo(videoFile.value);
      data.videoUrl = uploadResult.url;
    }

    if (isEditing.value) {
      await updateCourse(editingId.value, data);
      ElMessage.success('编辑成功');
    } else {
      await createCourse(data);
      ElMessage.success('新增成功');
    }

    formVisible.value = false;
    loadCourses();
  } catch {
    // handled
  } finally {
    submitting.value = false;
  }
}

async function handleToggle(row: CourseItem) {
  try {
    await updateCourse(row.id, { isActive: !row.isActive });
    ElMessage.success(row.isActive ? '已停用' : '已启用');
    loadCourses();
  } catch {
    // handled
  }
}

onMounted(() => {
  loadCourses();
});
</script>

<style scoped lang="scss">
.courses-page {
  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .table-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
    .table-pagination {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
