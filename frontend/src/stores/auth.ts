import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as loginApi, type LoginParams, type LoginResult } from '../api/auth';
import { setToken, setUser, clearStorage, getToken, getUser } from '../utils/storage';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken());
  const user = ref<any | null>(getUser());
  const isLoggedIn = ref<boolean>(!!token.value);

  async function login(params: LoginParams): Promise<LoginResult> {
    const result = await loginApi(params);
    token.value = result.token;
    user.value = result.user;
    isLoggedIn.value = true;

    setToken(result.token);
    setUser(result.user);
    return result;
  }

  function logout() {
    token.value = null;
    user.value = null;
    isLoggedIn.value = false;
    clearStorage();
  }

  function markPasswordChanged() {
    if (!user.value) return;
    user.value = { ...user.value, isFirstLogin: false };
    setUser(user.value);
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    logout,
    markPasswordChanged,
  };
});
