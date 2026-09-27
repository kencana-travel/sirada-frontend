import api from './client';
import type {
  ClusterResponse,
  ClusterRingkasan,
  SegmentasiRingkasanItem,
  SegmentasiRingkasanResponse,
} from '../types';

/* --- Bentuk respons mentah dari backend --- */

interface PelangganClusterRaw {
  nama_pelanggan: string;
  total_transaksi: number;
  total_belanja: number;
  status_loyalitas: string;
}

interface ClusterRaw {
  ringkasan_cluster: ClusterRingkasan[];
  pelanggan: PelangganClusterRaw[];
}

/**
 * GET /api/segmentasi/ringkasan — backend hanya mengirim array kartu per jenis member.
 * Distribusi diturunkan dari kartu tsb; wawasan & daftar pelanggan belum tersedia
 * (daftar pelanggan baru terisi setelah model clustering dijalankan).
 */
export async function getRingkasan(): Promise<SegmentasiRingkasanResponse> {
  const { data } = await api.get<SegmentasiRingkasanItem[]>('/api/segmentasi/ringkasan');
  return {
    segmen: data,
    distribusi: data.map((s) => ({
      segmen: s.jenis_member,
      jumlah: s.total_transaksi,
      persen: s.share_persen,
    })),
    pelanggan: [],
  };
}

/** GET /api/segmentasi/cluster — jalankan RFM + K-Means (Admin only). */
export async function getCluster(): Promise<ClusterResponse> {
  const { data } = await api.get<ClusterRaw>('/api/segmentasi/cluster');
  return {
    ringkasan_cluster: data.ringkasan_cluster,
    // nama_pelanggan dipakai backend sebagai proxy ID pelanggan.
    pelanggan: data.pelanggan.map((p) => ({
      id: p.nama_pelanggan,
      nama: p.nama_pelanggan,
      total_transaksi: p.total_transaksi,
      total_belanja: p.total_belanja,
      rata_rata_belanja: p.total_transaksi ? p.total_belanja / p.total_transaksi : undefined,
      status_loyalitas: p.status_loyalitas,
    })),
  };
}
