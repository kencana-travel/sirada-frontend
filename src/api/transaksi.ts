import api from './client';
import type {
  Transaksi,
  TransaksiCreatePayload,
  TransaksiListResponse,
  TransaksiQuery,
} from '../types';

/* --- Bentuk respons mentah dari backend (skema TransaksiOut) --- */

interface TransaksiRaw {
  id_transaksi: string;
  tanggal: string;
  jam_keberangkatan: string;
  rute: string; // "Solo->Semarang"
  layanan: string;
  channel_pemesanan: string;
  jenis_member: string | null;
  jumlah_unit: number;
  satuan: string;
  total_bayar: number;
  keterangan: string | null;
}

interface TransaksiListRaw {
  total: number;
  total_pendapatan?: number;
  halaman: number;
  per_halaman: number;
  data: TransaksiRaw[];
}

function toTransaksi(r: TransaksiRaw): Transaksi {
  const [asal, tujuan = ''] = r.rute.split('->');
  return {
    kode_transaksi: r.id_transaksi,
    tanggal: r.tanggal,
    jam: r.jam_keberangkatan,
    rute_asal: asal,
    rute_tujuan: tujuan,
    layanan: r.layanan,
    channel: r.channel_pemesanan,
    jenis_member: r.jenis_member ?? '-',
    unit: r.jumlah_unit,
    satuan: r.satuan,
  };
}

/** GET /api/transaksi — daftar transaksi dengan filter & pagination. */
function filterParams(query: TransaksiQuery) {
  return {
    cari: query.cari || undefined,
    rute: query.rute || undefined,
    layanan: query.layanan || undefined,
    channel: query.channel || undefined,
    tanggal_mulai: query.tanggal_mulai || undefined,
    tanggal_selesai: query.tanggal_selesai || undefined,
  };
}

export async function getTransaksi(query: TransaksiQuery = {}): Promise<TransaksiListResponse> {
  const params = {
    ...filterParams(query),
    halaman: query.halaman ?? 1,
    per_halaman: query.per_halaman ?? 10,
  };

  const { data } = await api.get<TransaksiListRaw>('/api/transaksi', { params });
  return {
    total: data.total,
    total_pendapatan: data.total_pendapatan,
    halaman: data.halaman,
    per_halaman: data.per_halaman,
    data: data.data.map(toTransaksi),
  };
}

/** POST /api/transaksi — tambah transaksi baru (Admin only). */
export async function createTransaksi(payload: TransaksiCreatePayload): Promise<Transaksi> {
  const { data } = await api.post<TransaksiRaw>('/api/transaksi', payload);
  return toTransaksi(data);
}

/**
 * GET /api/transaksi/export — unduh CSV sesuai filter aktif (Kepala Outlet: hanya cabangnya).
 * Diambil lewat axios (bukan link biasa) supaya header Authorization ikut terkirim.
 */
export async function downloadTransaksiCsv(query: TransaksiQuery = {}, namaFile?: string): Promise<void> {
  const res = await api.get<Blob>('/api/transaksi/export', {
    params: filterParams(query),
    responseType: 'blob',
    timeout: 60000,
  });
  const dariServer = /filename=([^;]+)/.exec(String(res.headers['content-disposition'] ?? ''))?.[1];
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = namaFile ?? dariServer ?? 'transaksi_export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
