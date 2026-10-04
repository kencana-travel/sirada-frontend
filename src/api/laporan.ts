import axios from 'axios';
import api from './client';
import type {
  FormatLaporan,
  OpsiLaporan,
  ParamLaporan,
  PermintaanCreate,
  PermintaanLaporan,
  PermintaanProses,
} from '../types/laporan';

/** Laporan ringkasan menjalankan forecasting semua rute: bisa puluhan detik. */
const TIMEOUT_LAPORAN = 300_000;

/** Simpan Blob sebagai file unduhan di browser. */
export function simpanBlob(blob: Blob, namaFile: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function namaDariHeader(header: unknown, cadangan: string): string {
  if (typeof header !== 'string') return cadangan;
  const m = /filename="?([^";]+)"?/i.exec(header);
  return m ? m[1] : cadangan;
}

/**
 * Error dari request ber-responseType blob berisi Blob JSON; ubah jadi objek supaya
 * getErrorMessage bisa membaca `detail`-nya.
 */
async function lemparErrorBlob(error: unknown): Promise<never> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text());
    } catch {
      /* bukan JSON: biarkan apa adanya */
    }
  }
  throw error;
}

function tanggalHariIni(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

/** GET /api/laporan/opsi — daftar cabang & cabang terkunci (Kepala Outlet). */
export async function getOpsiLaporan(): Promise<OpsiLaporan> {
  const { data } = await api.get<OpsiLaporan>('/api/laporan/opsi');
  return data;
}

/** GET /api/laporan/unduh — buat & unduh laporan langsung. */
export async function unduhLaporan(param: ParamLaporan): Promise<void> {
  const params: Record<string, string> = { jenis: param.jenis, format: param.format };
  if (param.tanggal_mulai) params.tanggal_mulai = param.tanggal_mulai;
  if (param.tanggal_selesai) params.tanggal_selesai = param.tanggal_selesai;
  if (param.cabang) params.cabang = param.cabang;
  try {
    const res = await api.get<Blob>('/api/laporan/unduh', {
      params,
      responseType: 'blob',
      timeout: TIMEOUT_LAPORAN,
    });
    simpanBlob(
      res.data,
      namaDariHeader(
        res.headers['content-disposition'],
        `laporan_${param.jenis}_${tanggalHariIni()}.${param.format}`,
      ),
    );
  } catch (e) {
    await lemparErrorBlob(e);
  }
}

/** GET /api/laporan/permintaan — Admin: semua; lainnya: milik sendiri. */
export async function getPermintaan(): Promise<PermintaanLaporan[]> {
  const { data } = await api.get<PermintaanLaporan[]>('/api/laporan/permintaan');
  return data;
}

/** POST /api/laporan/permintaan — Owner / Kepala Outlet mengajukan permintaan. */
export async function ajukanPermintaan(payload: PermintaanCreate): Promise<PermintaanLaporan> {
  const { data } = await api.post<PermintaanLaporan>('/api/laporan/permintaan', payload);
  return data;
}

/** POST /api/laporan/permintaan/{id}/proses — Admin menyelesaikan / menolak. */
export async function prosesPermintaan(
  id: string,
  payload: PermintaanProses,
): Promise<PermintaanLaporan> {
  const { data } = await api.post<PermintaanLaporan>(
    `/api/laporan/permintaan/${id}/proses`,
    payload,
  );
  return data;
}

/** GET /api/laporan/permintaan/{id}/unduh — hanya bila status selesai. */
export async function unduhPermintaan(p: PermintaanLaporan, format: FormatLaporan): Promise<void> {
  try {
    const res = await api.get<Blob>(`/api/laporan/permintaan/${p.id_permintaan}/unduh`, {
      params: { format },
      responseType: 'blob',
      timeout: TIMEOUT_LAPORAN,
    });
    simpanBlob(
      res.data,
      namaDariHeader(
        res.headers['content-disposition'],
        `laporan_${p.jenis_laporan}_${tanggalHariIni()}.${format}`,
      ),
    );
  } catch (e) {
    await lemparErrorBlob(e);
  }
}
