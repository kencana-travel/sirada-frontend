import api from './client';
import type { HasilImport, RiwayatImport, StatusData } from '../types/importData';
import { simpanBlob } from './laporan';

/** Upload & cleaning bisa memakan waktu (file s.d. 50 MB). */
const TIMEOUT_UPLOAD = 300_000;

/** POST /api/import/transaksi — dryRun=true hanya validasi & cleaning, tanpa menyimpan. */
export async function importTransaksi(
  file: File,
  dryRun: boolean,
  onProgress?: (persen: number) => void,
): Promise<HasilImport> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<HasilImport>('/api/import/transaksi', form, {
    params: { dry_run: dryRun },
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: TIMEOUT_UPLOAD,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

/** GET /api/import/riwayat */
export async function getRiwayatImport(): Promise<RiwayatImport[]> {
  const { data } = await api.get<RiwayatImport[]>('/api/import/riwayat');
  return data;
}

/** GET /api/import/status-data */
export async function getStatusData(): Promise<StatusData> {
  const { data } = await api.get<StatusData>('/api/import/status-data');
  return data;
}

/** GET /api/import/template — unduh template CSV. */
export async function unduhTemplate(): Promise<void> {
  const { data } = await api.get<Blob>('/api/import/template', { responseType: 'blob' });
  simpanBlob(data, 'template_transaksi.csv');
}
