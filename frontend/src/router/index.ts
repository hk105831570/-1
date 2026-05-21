import { createRouter, createWebHistory } from 'vue-router';
import { getToken, getUser } from '../utils/storage';

const basePath = import.meta.env.VITE_BASE_URL || '/training/';

const router = createRouter({
  history: createWebHistory(basePath),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/index.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/change-password',
      name: 'ChangePassword',
      component: () => import('../views/employee/ChangePassword.vue'),
      meta: { requiresAuth: true, title: '修改密码' },
    },
    {
      path: '/',
      component: () => import('../layouts/default.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../views/employee/courses/index.vue'),
          meta: { title: '我的课程' },
        },
        {
          path: 'course/:id',
          name: 'CoursePlayer',
          component: () => import('../views/employee/courses/player.vue'),
          meta: { title: '课程学习' },
        },
        {
          path: 'course/:id/exam',
          name: 'CourseExam',
          component: () => import('../views/employee/exam/index.vue'),
          meta: { title: '课程考试' },
        },
        {
          path: 'records',
          name: 'MyRecords',
          component: () => import('../views/employee/records/index.vue'),
          meta: { title: '学习记录' },
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('../views/admin/dashboard/index.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'employees',
          name: 'AdminEmployees',
          component: () => import('../views/admin/employees/index.vue'),
          meta: { title: '员工管理' },
        },
        {
          path: 'courses',
          name: 'AdminCourses',
          component: () => import('../views/admin/courses/index.vue'),
          meta: { title: '课程管理' },
        },
        {
          path: 'questions',
          name: 'AdminQuestions',
          component: () => import('../views/admin/questions/index.vue'),
          meta: { title: '题库管理' },
        },
        {
          path: 'records',
          name: 'AdminRecords',
          component: () => import('../views/admin/records/index.vue'),
          meta: { title: '学习记录' },
        },
        {
          path: 'position-courses',
          name: 'AdminPositionCourses',
          component: () => import('../views/admin/position-courses/index.vue'),
          meta: { title: '岗位映射' },
        },
      ],
    },
  ],
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = getToken();
  const user = getUser();

  // 需要登录但无 token → 登录页
  if (to.meta.requiresAuth !== false && !token) {
    return next('/login');
  }

  // 有 token 但访问登录页 → 按角色跳转
  if (to.path === '/login' && token) {
    return next(user?.role ? '/admin/dashboard' : '/');
  }

  // 有 token 访问根路径，管理员 → 后台
  if (to.path === '/' && token && user?.role) {
    return next('/admin/dashboard');
  }

  next();
});

export default router;
