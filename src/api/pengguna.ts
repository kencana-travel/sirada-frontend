import api from './client';
import type { CabangOption, Pengguna, SetujuiPenggunaRequest, StatusPengguna } from '../types';

/** GET /api/pengguna — daftar akun (Admin only). */
export async function getPengguna(status?: StatusPengguna): Promise<Pengguna[]> {
  const { data } = await api.get<Pengguna[]>('/api/pengguna', {
    params: { status: status || undefined },
  });
  return data;
}

/** GET /api/pengguna/cabang — pilihan cabang untuk akun Kepala Outlet. */
export async function getCabang(): Promise<CabangOption[]> {
  const { data } = await api.get<CabangOption[]>('/api/pengguna/cabang');
  return data;
}

/** POST /api/pengguna/{id}/setujui — aktifkan akun & tetapkan role. */
export async function setujuiPengguna(id: string, payload: SetujuiPenggunaRequest): Promise<Pengguna> {
  const { data } = await api.post<Pengguna>(`/api/pengguna/${id}/setujui`, payload);
  return data;
}

/** POST /api/pengguna/{id}/tolak — tolak pendaftaran. */
export async function tolakPengguna(id: string): Promise<Pengguna> {
  const { data } = await api.post<Pengguna>(`/api/pengguna/${id}/tolak`);
  return data;
}
