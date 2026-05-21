<template>
  <div class="position-courses-page">
    <el-row :gutter="16">
      <!-- 左侧：岗位列表 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>岗位列表</span>
              <el-button size="small" type="primary" @click="showAddPositionDialog">新增岗位</el-button>
            </div>
          </template>

          <el-table :data="positions" highlight-current-row @current-change="handlePositionChange">
            <el-table-column prop="name" label="岗位名" />
          </el-table>
          <div v-if="positions.length === 0" style="text-align:center;padding:30px;color:#909399">
            暂无岗位数据
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：课程列表 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>{{ currentPosition ? `"${currentPosition}" 的课程` : '请选择岗位' }}</span>
              <el-button size="small" type="primary" :disabled="!currentPosition" @click="showEditCoursesDialog">
                编辑课程
              </el-button>
            </div>
          </template>

          <el-table :data="positionCourseItems" v-loading="loading">
            <el-table-column prop="course.name" label="课程名" min-width="160" />
            <el-table-column prop="course.category" label="分类" width="120" />
            <el-table-column label="必修" width="60">
              <template #default="{ row }">
                {{ row.isRequired ? '是' : '否' }}
              </template>
            </el-table-column>
            <el-table-column label="有效期(月)" width="100">
              <template #default="{ row }">
                {{ row.validMonths === 0 ? '永久' : row.validMonths }}
              </template>
            </el-table-column>
          </el-table>

          <div v-if="currentPosition && positionCourseItems.length === 0" style="text-align:center;padding:30px;color:#909399">
            该岗位尚未配置课程
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增岗位弹窗 -->
    <el-dialog v-model="addPositionVisible" title="新增岗位" width="400px">
      <el-form ref="positionFormRef" :model="positionForm" :rules="positionRules" label-width="80px">
        <el-form-item label="岗位名" prop="name">
          <el-input v-model="positionForm.name" placeholder="请输入岗位名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addPositionVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddPosition">确认</el-button>
      </template>
    </el-dialog>

    <!-- 编辑课程弹窗 -->
    <el-dialog v-model="editCoursesVisible" title="编辑课程" width="500px">
      <p style="margin-bottom:12px;color:#606266">为岗位 "{{ currentPosition }}" 选择课程：</p>
      <el-checkbox-group v-model="selectedCourseIds">
        <el-checkbox v-for="c in allCourses" :key="c.id" :value="c.id" :label="c.id" style="display:flex;margin-bottom:8px">
          {{ c.name }} ({{ c.category || '未分类' }})
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="editCoursesVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveCourses">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getPositions, getPositionCourses, batchSetPositionCourses, createPosition } from '../../../api/position-course';
import { getCourses } from '../../../api/course';

// 岗位数据
const positions = ref<any[]>([]);
const currentPosition = ref<string | null>(null);
const positionCourseItems = ref<any[]>([]);
const loading = ref(false);

async function loadPositions() {
  try {
    const names: string[] = await getPositions();
    positions.value = names.map((n) => ({ name: n }));
    // 如果当前有选中岗位，重新加载
    if (currentPosition.value && names.includes(currentPosition.value)) {
      loadPositionCourses();
    }
  } catch {
    // handled
  }
}

async function loadPositionCourses() {
  if (!currentPosition.value) return;
  loading.value = true;
  try {
    const result: any = await getPositionCourses(currentPosition.value);
    positionCourseItems.value = result;
  } catch {
    positionCourseItems.value = [];
  } finally {
    loading.value = false;
  }
}

function handlePositionChange(row: any) {
  currentPosition.value = row?.name || null;
  if (currentPosition.value) {
    loadPositionCourses();
  }
}

// 新增岗位
const addPositionVisible = ref(false);
const positionFormRef = ref<any>(null);
const positionForm = reactive({ name: '' });
const positionRules = { name: [{ required: true, message: '请输入岗位名', trigger: 'blur' }] };

function showAddPositionDialog() {
  positionForm.name = '';
  addPositionVisible.value = true;
}

async function handleAddPosition() {
  const valid = await positionFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  const name = positionForm.name.trim();
  // 检查是否已存在
  if (positions.value.some((p) => p.name === name)) {
    ElMessage.warning('岗位已存在');
    return;
  }

  try {
    await createPosition(name);
    addPositionVisible.value = false;
    ElMessage.success('新增成功');
    await loadPositions();
  } catch {
    // handled
  }
}

// 编辑课程
const editCoursesVisible = ref(false);
const allCourses = ref<any[]>([]);
const selectedCourseIds = ref<number[]>([]);
const saving = ref(false);

async function showEditCoursesDialog() {
  if (!currentPosition.value) return;

  // 加载所有课程
  try {
    const result = await getCourses({ pageSize: 200 });
    allCourses.value = result.items;
  } catch {
    return;
  }

  // 已选课程
  selectedCourseIds.value = positionCourseItems.value.map((item) => item.courseId);
  editCoursesVisible.value = true;
}

async function handleSaveCourses() {
  if (!currentPosition.value) return;

  saving.value = true;
  try {
    await batchSetPositionCourses({
      position: currentPosition.value,
      courseIds: selectedCourseIds.value,
    });
    ElMessage.success('保存成功');
    editCoursesVisible.value = false;
    loadPositionCourses();
  } catch {
    // handled
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadPositions();
});
</script>

<style scoped lang="scss">
.position-courses-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
}
</style>
