/* ============================ FORECASTING ============================ */

export interface ForecastRunRequest {
  rute: string;
  horizon_hari: number;
  /** Tambahkan dummy kalender (akhir pekan, libur nasional, libur sekolah) -> kandidat SARIMAX. */
  pakai_kalender: boolean;
}

export interface ForecastDeretPoint {
  tanggal: string;
  aktual?: number | null;
  prediksi?: number | null;
}

export type KategoriMape = 'Sangat baik' | 'Baik' | 'Layak' | 'Buruk';

export interface PerbandinganModel {
  model: string;
  mae: number;
  rmse: number;
  mape_persen: number;
  kategori_mape: KategoriMape;
  terpilih: boolean;
}

export interface KapasitasRute {
  perjalanan_per_hari: number;
  kapasitas_per_perjalanan: number;
  kursi_per_hari: number;
  target_load_factor_persen: number;
  prediksi_puncak_harian: number;
  tanggal_puncak: string;
  prediksi_rata_harian: number;
  load_factor_puncak_persen: number;
  load_factor_rata_persen: number;
  hari_perlu_tambahan: number;
}

export interface ForecastRunResponse {
  rute: string;
  model: string;
  adf_p_value: number;
  ordo_differencing: number;
  prediksi_periode_berikutnya: number;
  horizon_hari: number;
  akurasi_persen: number;
  mape_persen: number;
  mae: number;
  rmse: number;
  kategori_mape: KategoriMape;
  valid: boolean;
  mape_maks_valid: number;
  perbandingan: PerbandinganModel[];
  pakai_kalender: boolean;
  variabel_eksogen: string[];
  hari_uji: number;
  jendela_latih_hari: number;
  periode_data: { mulai: string; selesai: string };
  rekomendasi_unit_tambahan: number;
  catatan_jadwal: string;
  kapasitas: KapasitasRute;
  /** Diagnostic checking: uji Ljung-Box pada residual model terpilih. */
  uji_residual?: { metode: string; lag: number; p_value: number; lolos: boolean } | null;
  deret: ForecastDeretPoint[];
  durasi_detik: number;
  dari_cache: boolean;
}
