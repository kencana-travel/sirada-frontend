import api from './client';
import type { VipVsRegulerResponse } from '../types';
import type { PerformaCabangItem, PerformaFilter, PerformaRuteItem } from '../types/performa';

/* --- Bentuk respons mentah dari backend --- */

interface VipVsRegulerRaw {
  layanan: string;
  share_persen: number; // share jumlah transaksi
  rata_harga_tiket: number;
  total_pendapatan: number;
  total_penumpang?: number;
  total_trip?: number;
  okupansi_persen?: number;
}

// Agregasi pertama kali (sebelum cache server terisi) bisa beberapa detik di server kecil,
// jadi endpoint performa diberi batas waktu lebih longgar dari default 20 detik.
const TIMEOUT_PERFORMA = 60000;

function params(filter: PerformaFilter = {}) {
  return {
    tanggal_mulai: filter.tanggal_mulai || undefined,
    tanggal_selesai: filter.tanggal_selesai || undefined,
  };
}

/** GET /api/performa-rute — performa per rute (Kepala Outlet: hanya rute cabangnya). */
export async function getPerformaRute(filter: PerformaFilter = {}): Promise<PerformaRuteItem[]> {
  const { data } = await api.get<PerformaRuteItem[]>('/api/performa-rute', {
    params: params(filter),
    timeout: TIMEOUT_PERFORMA,
  });
  return data;
}

/** GET /api/performa-rute/cabang — performa per cabang asal keberangkatan. */
export async function getPerformaCabang(filter: PerformaFilter = {}): Promise<PerformaCabangItem[]> {
  const { data } = await api.get<PerformaCabangItem[]>('/api/performa-rute/cabang', {
    params: params(filter),
    timeout: TIMEOUT_PERFORMA,
  });
  return data;
}

/** GET /api/performa-rute/vip-vs-reguler — perbandingan kontribusi & harga per kelas layanan. */
export async function getVipVsReguler(filter: PerformaFilter = {}): Promise<VipVsRegulerResponse> {
  const { data } = await api.get<VipVsRegulerRaw[]>('/api/performa-rute/vip-vs-reguler', {
    params: params(filter),
    timeout: TIMEOUT_PERFORMA,
  });
  const totalPendapatan = data.reduce((s, k) => s + k.total_pendapatan, 0);
  return {
    kelas: data.map((k) => ({
      kelas: k.layanan,
      kontribusi_persen: totalPendapatan ? (k.total_pendapatan / totalPendapatan) * 100 : 0,
      share_transaksi_persen: k.share_persen,
      rata_rata_harga: k.rata_harga_tiket,
      total_pendapatan: k.total_pendapatan,
    })),
  };
}
