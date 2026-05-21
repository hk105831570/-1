import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: number;
    employeeId?: string;
    username?: string;
    name: string;
    department?: string;
    position?: string;
    role?: string;
    isFirstLogin?: boolean;
  };
}

export function login(data: LoginParams) {
  return request.post<any, LoginResult>('/auth/login', data);
}
