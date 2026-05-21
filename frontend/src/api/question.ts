import request from './request';

export async function getQuestions(params: { courseId: number; page?: number; pageSize?: number }) {
  const res = await request.get('/admin/questions', { params });
  return res as any;
}

export async function createQuestion(data: any) {
  const res = await request.post('/admin/questions', data);
  return res as any;
}

export async function updateQuestion(id: number, data: any) {
  const res = await request.patch(`/admin/questions/${id}`, data);
  return res as any;
}

export async function deleteQuestion(id: number) {
  const res = await request.delete(`/admin/questions/${id}`);
  return res as any;
}
