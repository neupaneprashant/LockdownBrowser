const TOKEN_KEY = 'exam_browser_token';

export function useAuth() {
  const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  };

  const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  };

  const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
  };

  const isAuthenticated = (): boolean => {
    return !!getToken();
  };

  return {
    getToken,
    setToken,
    removeToken,
    isAuthenticated,
  };
}

