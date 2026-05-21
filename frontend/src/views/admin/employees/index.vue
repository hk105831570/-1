<template>
  <div class="employee-page">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="query" inline size="default">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="工号/姓名/手机号" clearable style="width: 200px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="query.department" placeholder="部门" clearable style="width: 150px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="在职" value="active" />
            <el-option label="离职" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">员工列表</div>
        <div class="table-actions">
          <el-button type="primary" @click="showAddDialog">新增员工</el-button>
          <el-button @click="showImportDialog">Excel 导入</el-button>
        </div>
      </div>

      <el-table :data="employees" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="employeeId" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="idNumber" label="身份证号" width="200">
          <template #default="{ row }">
            <span>{{ row.idNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="department" label="部门" width="140" />
        <el-table-column prop="position" label="岗位" width="140" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isFirstLogin" label="是否首次" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isFirstLogin ? 'warning' : 'success'" size="small">
              {{ row.isFirstLogin ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="showEdit(row)">编辑</el-button>
            <el-button
              link
              :type="row.status === 'active' ? 'danger' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '停用' : '启用' }}
            </el-button>
            <el-button link type="warning" size="small" @click="handleResetPwd(row)">重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="loadEmployees"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEditing ? '编辑员工' : '新增员工'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="工号" prop="employeeId" v-if="!isEditing">
          <el-input v-model="form.employeeId" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idNumber" v-if="!isEditing">
          <el-input v-model="form.idNumber" placeholder="请输入18位身份证号" maxlength="18" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="form.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="岗位" prop="position">
          <el-input v-model="form.position" placeholder="请输入岗位" />
        </el-form-item>
        <el-form-item label="入职日期" prop="hireDate">
          <el-date-picker v-model="form.hireDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <!-- Excel 导入弹窗 -->
    <el-dialog v-model="importVisible" title="Excel 导入员工" width="480px">
      <div class="import-tip">
        <p>请上传 Excel 文件，包含以下列：<strong>工号、姓名、身份证号、手机号、部门、岗位</strong></p>
        <p>必填列：工号、姓名、身份证号</p>
      </div>
      <el-upload
        drag
        :auto-upload="false"
        accept=".xlsx,.xls"
        :limit="1"
        :on-change="handleFileChange"
        :file-list="importFileList"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">将文件拖到此处，或<em>点击选择</em></div>
      </el-upload>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" :disabled="!importFile" @click="handleImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="员工详情" width="500px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="工号">{{ detailData.employeeId }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="身份证号" span="2">{{ detailData.idNumber }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ detailData.department || '-' }}</el-descriptions-item>
        <el-descriptions-item label="岗位">{{ detailData.position || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 'active' ? 'success' : 'info'" size="small">
            {{ detailData.status === 'active' ? '在职' : '离职' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="入职日期">{{ detailData.hireDate ? detailData.hireDate.substring(0, 10) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" span="2">{{ detailData.createdAt }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getEmployees, createEmployee, updateEmployee, deactivateEmployee, activateEmployee, resetPassword, importEmployees, getEmployee } from '../../../api/employee';
import type { EmployeeItem } from '../../../api/employee';
import type { UploadFile } from 'element-plus';
import dayjs from 'dayjs';

const loading = ref(false);
const employees = ref<EmployeeItem[]>([]);
const total = ref(0);

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  department: '',
  position: '',
  status: '',
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
});

async function loadEmployees() {
  loading.value = true;
  try {
    const result = await getEmployees(query);
    employees.value = result.items;
    total.value = result.total;
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadEmployees();
}

function handleReset() {
  query.keyword = '';
  query.department = '';
  query.status = '';
  query.page = 1;
  loadEmployees();
}

// 新增/编辑
const formVisible = ref(false);
const isEditing = ref(false);
const editingId = ref(0);
const submitting = ref(false);
const formRef = ref<any>(null);

const form = reactive({
  employeeId: '',
  name: '',
  idNumber: '',
  phone: '',
  department: '',
  position: '',
  hireDate: null as string | null,
});

const formRules = {
  employeeId: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  idNumber: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' },
  ],
};

function showAddDialog() {
  isEditing.value = false;
  editingId.value = 0;
  form.employeeId = '';
  form.name = '';
  form.idNumber = '';
  form.phone = '';
  form.department = '';
  form.position = '';
  form.hireDate = null;
  formVisible.value = true;
}

function showEdit(row: EmployeeItem) {
  isEditing.value = true;
  editingId.value = row.id;
  form.employeeId = row.employeeId;
  form.name = row.name;
  form.idNumber = '';
  form.phone = row.phone;
  form.department = row.department;
  form.position = row.position;
  form.hireDate = row.hireDate ? dayjs(row.hireDate).format('YYYY-MM-DD') : null;
  formVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const data: any = { ...form };
    if (data.hireDate) data.hireDate = dayjs(data.hireDate).format('YYYY-MM-DD');

    if (isEditing.value) {
      // 编辑时不需要 idNumber 和 employeeId
      delete data.employeeId;
      delete data.idNumber;
      await updateEmployee(editingId.value, data);
      ElMessage.success('编辑成功');
    } else {
      await createEmployee(data);
      ElMessage.success('新增成功');
    }

    formVisible.value = false;
    loadEmployees();
  } catch {
    // handled
  } finally {
    submitting.value = false;
  }
}

// 停用/启用
async function handleToggleStatus(row: EmployeeItem) {
  const action = row.status === 'active' ? '停用' : '启用';
  try {
    await ElMessageBox.confirm(`确认${action}员工 "${row.name}"？`, '提示');
    if (row.status === 'active') {
      await deactivateEmployee(row.id);
    } else {
      await activateEmployee(row.id);
    }
    ElMessage.success(`${action}成功`);
    loadEmployees();
  } catch {
    // canceled or error
  }
}

// 重置密码
async function handleResetPwd(row: EmployeeItem) {
  try {
    await ElMessageBox.confirm(
      `确认重置员工 "${row.name}" 的密码？重置后密码为身份证后六位。`,
      '重置密码',
      { confirmButtonText: '确认重置', type: 'warning' },
    );
    await resetPassword(row.id);
    ElMessage.success('密码已重置');
  } catch {
    // canceled
  }
}

// 导入
const importVisible = ref(false);
const importFile = ref<File | null>(null);
const importFileList = ref<any[]>([]);
const importing = ref(false);

function showImportDialog() {
  importFile.value = null;
  importFileList.value = [];
  importVisible.value = true;
}

function handleFileChange(uploadFile: UploadFile) {
  if (uploadFile.raw) {
    importFile.value = uploadFile.raw;
  }
}

async function handleImport() {
  if (!importFile.value) {
    ElMessage.warning('请选择文件');
    return;
  }

  importing.value = true;
  try {
    const result: any = await importEmployees(importFile.value);
    ElMessage.success(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`);
    if (result.errors?.length > 0) {
      console.log('导入错误:', result.errors);
    }
    importVisible.value = false;
    loadEmployees();
  } catch {
    // handled
  } finally {
    importing.value = false;
  }
}

// 详情
const detailVisible = ref(false);
const detailData = ref<any>(null);

async function showDetail(row: EmployeeItem) {
  try {
    const data = await getEmployee(row.id);
    detailData.value = data;
    detailVisible.value = true;
  } catch {
    // handled
  }
}

onMounted(() => {
  loadEmployees();
});
</script>

<style scoped lang="scss">
.employee-page {
  padding: 0;
}

.search-card {
  margin-bottom: 16px;
}

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

.import-tip {
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;

  p {
    margin-bottom: 8px;
  }
}

.upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 8px;
}

.upload-text {
  color: #606266;
  font-size: 14px;

  em {
    color: #409eff;
    font-style: normal;
  }
}
</style>
