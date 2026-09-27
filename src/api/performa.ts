import api from './client';
import type { PerformaRute, VipVsRegulerResponse } from '../types';

/* --- Bentuk respons mentah dari backend --- */

interface VipVsRegulerRaw {
  layanan: string;
  share_persen: number; // share jumlah transaksi
  rata_harga_tiket: number;
  total_pendapatan: number;
}

/** GET /api/performa-rute — daftar performa seluruh rute utama. */
export async function getPerformaRute(): Promise<PerformaRute[]> {
  const { data } = await api.get<PerformaRute[]>('/api/performa-rute');
  return data;
}

/** GET /api/performa-rute/vip-vs-reguler — perbandingan kontribusi & harga per kelas layanan. */
export async function getVipVsReguler(): Promise<VipVsRegulerResponse> {
  const { data } = await api.get<VipVsRegulerRaw[]>('/api/performa-rute/vip-vs-reguler');
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
