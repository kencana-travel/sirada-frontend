import type { ClusterResponse, ClusterRingkasan } from './index';

/* ===================== SEGMENTASI (RFM + K-Means) ===================== */

/** Metrik evaluasi K-Means untuk satu nilai K (Elbow, Silhouette, DBI). */
export interface EvaluasiPerK {
  k: number;
  inertia: number;
  silhouette: number | null;
  dbi: number | null;
}

export interface EvaluasiCluster {
  k_terpilih: number | null;
  /** "otomatis" = Silhouette tertinggi; "manual" = K dipilih pengguna. */
  mode?: 'otomatis' | 'manual';
  silhouette: number | null;
  dbi: number | null;
  /** true bila Silhouette >= silhouette_min_valid (0,5). */
  valid: boolean;
  silhouette_min_valid?: number;
  per_k: EvaluasiPerK[];
}

/** Profil centroid tiap cluster (rata-rata RFM asli, bukan hasil normalisasi). */
export interface ProfilCluster extends ClusterRingkasan {
  persen_pelanggan?: number;
  /** Skor komposit (1 - R) + F + M pada skala Min-Max; dasar pemberian label. */
  skor?: number;
}

export interface HasilSegmentasi extends ClusterResponse {
  ringkasan_cluster: ProfilCluster[];
  evaluasi: EvaluasiCluster;
  jumlah_pelanggan: number;
  pesan?: string;
}
