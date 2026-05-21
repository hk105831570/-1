import request from './request';

export interface QueryStudyRecordParams {
  keyword?: string;
  department?: string;
  courseId?: number;
  isCompleted?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function getStudyRecords(params: QueryStudyRecordParams) {
  const res = await request.get('/admin/study-records', { params });
  return res as any;
}
