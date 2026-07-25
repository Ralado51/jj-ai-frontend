import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://api.jjnetwork.com.br",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});
