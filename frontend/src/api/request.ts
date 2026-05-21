import axios from 'axios';
import { getToken, clearStorage } from '../utils/storage';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/training/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 JWT
request.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：统一解包 + 处理错误
request.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body.code === 200) {
      return body.data;
    }
    return body;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          clearStorage();
          window.location.href = '/training/login';
          ElMessage.error('登录已过期，请重新登录');
          break;
        case 403:
          ElMessage.error('没有权限访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 422:
          ElMessage.error(data?.message || '参数校验失败');
          break;
        default:
          ElMessage.error(data?.message || '服务器错误');
      }
    } else {
      ElMessage.error('网络连接失败');
    }
    return Promise.reject(error);
  },
);

export default request;
