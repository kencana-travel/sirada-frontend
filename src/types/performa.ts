/** Tipe respons Analisis Performa Rute & Cabang (GET /api/performa-rute, /cabang). */

export type StatusOkupansi = 'Tinggi' | 'Sedang' | 'Rendah';

export interface MetrikPerforma {
  total_trip: number;
  total_transaksi: number;
  total_penumpang: number;
  total_pendapatan: number;
  kapasitas_tersedia: number;
  /** Rata-rata okupansi per trip (penumpang trip / kapasitas armada x 100). */
  okupansi_persen: number;
  layanan_dominan: string;
  layanan_dominan_persen: number;
  rata_penumpang_per_trip: number;
  status: StatusOkupansi;
  kontribusi_pendapatan_persen: number;
}

export interface PerformaRuteItem extends MetrikPerforma {
  id_rute: string;
  rute: string;
  cabang_asal?: string | null;
  cabang_tujuan?: string | null;
}

export interface PerformaCabangItem extends MetrikPerforma {
  cabang: string;
  jumlah_rute: number;
}

export interface PerformaFilter {
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}
