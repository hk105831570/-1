import request from './request';

export async function getMyCourses() {
  const res = await request.get('/employee/courses');
  return res as any;
}

export async function updateProgress(data: { courseId: number; increment: number; currentProgress: number }) {
  const res = await request.post('/employee/progress', data);
  return res as any;
}

export async function getExamQuestions(courseId: number) {
  const res = await request.get(`/employee/exam/${courseId}`);
  return res as any;
}

export async function submitExam(data: { courseId: number; answers: { questionId: number; answer: string }[] }) {
  const res = await request.post('/employee/exam/submit', data);
  return res as any;
}

export async function getMyRecords() {
  const res = await request.get('/employee/records');
  return res as any;
}
