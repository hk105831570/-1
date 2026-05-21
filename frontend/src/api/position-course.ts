import request from './request';

export async function createPosition(name: string) {
  const res = await request.post('/admin/position-courses/positions', { name });
  return res as any;
}

export async function getPositionCourses(position?: string) {
  const params = position ? { position } : {};
  const res = await request.get('/admin/position-courses', { params });
  return res as any;
}

export async function getPositions(): Promise<string[]> {
  const res = await request.get('/admin/position-courses/positions');
  return res as any;
}

export async function createPositionCourse(data: { position: string; courseId: number; isRequired?: boolean; validMonths?: number }) {
  const res = await request.post('/admin/position-courses', data);
  return res as any;
}

export async function deletePositionCourse(id: number) {
  const res = await request.delete(`/admin/position-courses/${id}`);
  return res as any;
}

export async function batchSetPositionCourses(data: { position: string; courseIds: number[] }) {
  const res = await request.post('/admin/position-courses/batch', data);
  return res as any;
}
