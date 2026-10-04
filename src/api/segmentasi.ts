import api from './client';
import type {
  ClusterRingkasan,
  SegmentasiRingkasanItem,
  SegmentasiRingkasanResponse,
} from '../types';
import type { EvaluasiCluster, HasilSegmentasi, ProfilCluster } from '../types/segmentasi';

/* --- Bentuk respons mentah dari backend --- */

interface PelangganClusterRaw {
  nama_pelanggan: string;
  total_transaksi: number;
  total_belanja: number;
  recency_hari?: number;
  status_loyalitas: string;
}

interface ClusterRaw {
  ringkasan_cluster: (ClusterRingkasan & Partial<ProfilCluster>)[];
  pelanggan: PelangganClusterRaw[];
  evaluasi: EvaluasiCluster;
  jumlah_pelanggan?: number;
  pesan?: string;
}

/** RFM + K-Means untuk K = 2..8 bisa memakan waktu, terutama di server produksi. */
const TIMEOUT_CLUSTER = 180000;

/**
 * GET /api/segmentasi/ringkasan — backend hanya mengirim array kartu per jenis member
 * (Kepala Outlet otomatis dibatasi ke cabangnya). Distribusi diturunkan dari kartu tsb;
 * daftar pelanggan baru terisi setelah segmentasi dijalankan.
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

/**
 * GET /api/segmentasi/cluster — RFM + Min-Max + K-Means (Admin only).
 * `nCluster` kosong = K dipilih otomatis dari Silhouette tertinggi.
 */
export async function getCluster(nCluster?: number | null): Promise<HasilSegmentasi> {
  const params = nCluster ? { n_cluster: nCluster } : undefined;
  const { data } = await api.get<ClusterRaw>('/api/segmentasi/cluster', {
    params,
    timeout: TIMEOUT_CLUSTER,
  });
  return {
    ringkasan_cluster: data.ringkasan_cluster,
    evaluasi: data.evaluasi,
    jumlah_pelanggan: data.jumlah_pelanggan ?? data.pelanggan.length,
    pesan: data.pesan,
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
