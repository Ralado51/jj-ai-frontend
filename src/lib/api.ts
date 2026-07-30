import axios from "axios";

const TOKEN_KEY = "jj_ai_access_token";
const AUTH_EXPIRED_EVENT = "jj-ai-auth-expired";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://api.jjnetwork.com.br",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

export { AUTH_EXPIRED_EVENT, TOKEN_KEY };
