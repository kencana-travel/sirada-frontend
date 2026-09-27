import api from './client';
import type { LoginRequest, LoginResponse, PesanResponse, RegisterRequest } from '../types';

/** POST /api/auth/login — otentikasi dengan email & password. */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', payload);
  return data;
}

/** POST /api/auth/register — daftar akun; link verifikasi dikirim ke email. */
export async function register(payload: RegisterRequest): Promise<PesanResponse> {
  const { data } = await api.post<PesanResponse>('/api/auth/register', payload);
  return data;
}

/** POST /api/auth/verifikasi-email — konfirmasi token dari link di email. */
export async function verifikasiEmail(token: string): Promise<PesanResponse> {
  const { data } = await api.post<PesanResponse>('/api/auth/verifikasi-email', { token });
  return data;
}

/** POST /api/auth/kirim-ulang-verifikasi — minta link verifikasi baru. */
export async function kirimUlangVerifikasi(email: string): Promise<PesanResponse> {
  const { data } = await api.post<PesanResponse>('/api/auth/kirim-ulang-verifikasi', { email });
  return data;
}

/** POST /api/auth/lupa-password — kirim link reset kata sandi ke email. */
export async function lupaPassword(email: string): Promise<PesanResponse> {
  const { data } = await api.post<PesanResponse>('/api/auth/lupa-password', { email });
  return data;
}

/** POST /api/auth/reset-password — set kata sandi baru dengan token dari email. */
export async function resetPassword(token: string, password_baru: string): Promise<PesanResponse> {
  const { data } = await api.post<PesanResponse>('/api/auth/reset-password', { token, password_baru });
  return data;
}
