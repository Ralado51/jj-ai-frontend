import axios from "axios";

const TOKEN_KEY = "jj_ai_access_token";

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
