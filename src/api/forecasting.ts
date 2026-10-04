import api from './client';
import type { ForecastRunRequest, ForecastRunResponse } from '../types/forecasting';

/** Perbandingan beberapa model statistik bisa makan waktu puluhan detik di server. */
const TIMEOUT_FORECAST = 180000;

/** GET /api/forecasting/rute-tersedia — daftar koridor/rute untuk dropdown. */
export async function getRuteTersedia(): Promise<string[]> {
  const { data } = await api.get<string[] | { rute: string[] } | { data: string[] }>(
    '/api/forecasting/rute-tersedia',
  );
  if (Array.isArray(data)) return data;
  if ('rute' in data) return data.rute;
  return data.data;
}

/** POST /api/forecasting/run — bandingkan model & jalankan prediksi demand (Admin only). */
export async function runForecast(payload: ForecastRunRequest): Promise<ForecastRunResponse> {
  const { data } = await api.post<ForecastRunResponse>('/api/forecasting/run', payload, {
    timeout: TIMEOUT_FORECAST,
  });
  return data;
}
