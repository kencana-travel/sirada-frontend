import api from './client';
import type { EdaFilter, EdaResponse } from '../types/eda';

/** Agregasi atas ratusan ribu baris; beri waktu lebih untuk server produksi. */
const TIMEOUT_EDA = 120000;

/** GET /api/eda — Exploratory Data Analysis (Kepala Outlet otomatis dibatasi ke cabangnya). */
export async function getEda(filter: EdaFilter = {}): Promise<EdaResponse> {
  const params: Record<string, string> = {};
  if (filter.tanggal_mulai) params.tanggal_mulai = filter.tanggal_mulai;
  if (filter.tanggal_selesai) params.tanggal_selesai = filter.tanggal_selesai;
  const { data } = await api.get<EdaResponse>('/api/eda', { params, timeout: TIMEOUT_EDA });
  return data;
}
