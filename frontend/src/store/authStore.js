import { create } from 'zustand';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function getSafeUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw || raw === 'undefined') return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getValidToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === 'undefined') return null;
  // If we have a token but no valid user data, the token is stale — clear it
  const user = getSafeUser();
  if (!user) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
  return token;
}

const useAuthStore = create((set) => ({
  token: getValidToken(),
  user: getSafeUser(),

  login: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
