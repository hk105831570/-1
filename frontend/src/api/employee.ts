import request from './request';

export interface EmployeeQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  department?: string;
  position?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeeItem {
  id: number;
  employeeId: string;
  name: string;
  idNumber: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  status: string;
  isFirstLogin: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getEmployees(params: EmployeeQuery): Promise<PaginatedResult<EmployeeItem>> {
  const res = await request.get('/admin/users', { params });
  return res as any;
}

export async function getEmployee(id: number): Promise<EmployeeItem> {
  const res = await request.get(`/admin/users/${id}`);
  return res as any;
}

export async function createEmployee(data: {
  employeeId: string;
  name: string;
  idNumber: string;
  phone?: string;
  department?: string;
  position?: string;
  hireDate?: string;
}) {
  const res = await request.post('/admin/users', data);
  return res as any;
}

export async function updateEmployee(id: number, data: any) {
  const res = await request.patch(`/admin/users/${id}`, data);
  return res as any;
}

export async function deactivateEmployee(id: number) {
  const res = await request.post(`/admin/users/${id}/deactivate`);
  return res as any;
}

export async function activateEmployee(id: number) {
  const res = await request.post(`/admin/users/${id}/activate`);
  return res as any;
}

export async function resetPassword(id: number) {
  const res = await request.post(`/admin/users/${id}/reset-password`);
  return res as any;
}

export async function importEmployees(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await request.post('/admin/users/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res as any;
}

export async function getPositionHistory(userId: number) {
  const res = await request.get(`/admin/users/${userId}/position-history`);
  return res as any;
}
