import api from './client';
import type { ForecastRunRequest, ForecastRunResponse } from '../types';

/** GET /api/forecasting/rute-tersedia — daftar koridor/rute untuk dropdown. */
export async function getRuteTersedia(): Promise<string[]> {
  const { data } = await api.get<string[] | { rute: string[] } | { data: string[] }>(
    '/api/forecasting/rute-tersedia',
  );
  if (Array.isArray(data)) return data;
  if ('rute' in data) return data.rute;
  return data.data;
}

/** POST /api/forecasting/run — jalankan model prediksi demand (Admin only). */
export async function runForecast(payload: ForecastRunRequest): Promise<ForecastRunResponse> {
  const { data } = await api.post<ForecastRunResponse>('/api/forecasting/run', payload);
  return data;
}
