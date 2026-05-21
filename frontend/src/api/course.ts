import request from './request';

export interface CourseItem {
  id: number;
  name: string;
  category: string;
  videoUrl: string;
  videoDuration: number;
  version: number;
  passingScore: number;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getCourses(params: { page?: number; pageSize?: number; keyword?: string; isActive?: boolean }): Promise<PaginatedResult<CourseItem>> {
  const res = await request.get('/admin/courses', { params });
  return res as any;
}

export async function getCourse(id: number): Promise<CourseItem> {
  const res = await request.get(`/admin/courses/${id}`);
  return res as any;
}

export async function createCourse(data: any) {
  const res = await request.post('/admin/courses', data);
  return res as any;
}

export async function updateCourse(id: number, data: any) {
  const res = await request.patch(`/admin/courses/${id}`, data);
  return res as any;
}

export async function uploadVideo(file: File, onProgress?: (pct: number) => void) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await request.post('/admin/upload/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e: any) => onProgress(Math.round((e.loaded / e.total) * 100))
      : undefined,
  });
  return res as any;
}
