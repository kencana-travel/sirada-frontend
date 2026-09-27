import axios, { AxiosError } from 'axios';
import { clearAuth, getToken, UNAUTHORIZED_EVENT } from '../lib/storage';

// Dibaca saat BUILD (bukan saat runtime): di Railway, set VITE_API_BASE_URL di Variables
// sebelum build. Tidak ada fallback ke localhost supaya build produksi yang lupa di-set
// langsung ketahuan, bukan diam-diam memanggil localhost di browser pengguna.
const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
if (!baseURL) {
  // eslint-disable-next-line no-console
  console.error('VITE_API_BASE_URL belum di-set saat build — panggilan API akan gagal.');
}

/** Instance axios terpusat untuk seluruh pemanggilan API. */
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

/* --- Request interceptor: attach Bearer token dari localStorage --- */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* --- Response interceptor: tangani 401 (token invalid/expired) --- */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuth();
      // Beritahu AuthContext agar redirect ke /login (SPA, tanpa reload penuh).
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Ekstrak pesan error yang ramah dari sebuah AxiosError. */
export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string | { msg?: string }[]; message?: string; pesan?: string }
      | undefined;
    if (data) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
      if (data.message) return data.message;
      if (data.pesan) return data.pesan;
    }
    if (error.code === 'ECONNABORTED') return 'Permintaan timeout. Periksa koneksi server.';
    if (error.message === 'Network Error') {
      return 'Tidak dapat terhubung ke server. Pastikan backend berjalan.';
    }
  }
  return fallback;
}

export default api;
