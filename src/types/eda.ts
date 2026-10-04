/* ===================== EKSPLORASI DATA (EDA) ===================== */

export interface EdaRingkasan {
  jumlah_baris: number;
  tanggal_awal: string | null;
  tanggal_akhir: string | null;
  rentang_hari: number;
  jumlah_rute: number;
  jumlah_pelanggan: number;
  jumlah_cabang: number;
  total_penumpang: number;
  total_pendapatan: number;
  min_baris_analisis: number;
  memenuhi_min_baris: boolean;
}

export interface EdaKelengkapan {
  kolom: string;
  terisi: number;
  kosong: number;
  persen_kosong: number;
}

export interface EdaStatistik {
  variabel: string;
  keterangan: string;
  count: number;
  mean: number | null;
  std: number | null;
  min: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  max: number | null;
}

export interface EdaTrenBulanan {
  bulan: string; // YYYY-MM
  label: string; // "Sep 23"
  transaksi: number;
  penumpang: number;
  pendapatan: number;
  hari_aktif: number;
}

export interface EdaPolaHari {
  hari: string;
  urutan: number;
  jumlah_hari: number;
  rata_penumpang: number;
  rata_transaksi: number;
  rata_pendapatan: number;
}

export interface EdaEfekKalender {
  faktor: 'weekend' | 'libur_nasional' | 'libur_sekolah' | string;
  nama: string;
  label_ya: string;
  label_tidak: string;
  jumlah_hari_ya: number;
  jumlah_hari_tidak: number;
  rata_penumpang_ya: number | null;
  rata_penumpang_tidak: number | null;
  rata_pendapatan_ya: number | null;
  rata_pendapatan_tidak: number | null;
  selisih_persen: number | null;
}

export interface EdaDistribusiItem {
  kategori: string;
  transaksi: number;
  penumpang: number;
  pendapatan: number;
  persen_transaksi: number;
  persen_pendapatan: number;
}

export type EdaKategoriDistribusi =
  | 'rute'
  | 'layanan'
  | 'channel_pemesanan'
  | 'jenis_member'
  | 'jenis_transaksi';

export interface EdaResponse {
  filter: { cabang: string | null; tanggal_mulai: string | null; tanggal_selesai: string | null };
  ringkasan: EdaRingkasan;
  kelengkapan: EdaKelengkapan[];
  statistik: EdaStatistik[];
  tren_bulanan: EdaTrenBulanan[];
  pola_hari: EdaPolaHari[];
  efek_kalender: EdaEfekKalender[];
  hari_tanpa_kalender: number;
  distribusi: Partial<Record<EdaKategoriDistribusi, EdaDistribusiItem[]>>;
}

export interface EdaFilter {
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}
