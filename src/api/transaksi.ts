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
export async function getTransaksi(query: TransaksiQuery = {}): Promise<TransaksiListResponse> {
  const params = {
    cari: query.cari || undefined,
    rute: query.rute || undefined,
    layanan: query.layanan || undefined,
    channel: query.channel || undefined,
    halaman: query.halaman ?? 1,
    per_halaman: query.per_halaman ?? 10,
  };

  const { data } = await api.get<TransaksiListRaw>('/api/transaksi', { params });
  return {
    total: data.total,
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
