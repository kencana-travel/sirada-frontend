/** Tipe data fitur Import CSV + data cleaning (lihat backend app/schemas/import_data.py). */

export type KategoriTolak = 'kosong' | 'tidak_valid' | 'duplikat' | 'sudah_ada';

export interface SampelDitolak {
  baris: number;
  kode_transaksi: string | null;
  kategori: KategoriTolak;
  alasan: string;
}

export interface EntitasBaru {
  cabang: number;
  rute: number;
  armada: number;
  member: number;
  jenis_paket: number;
}

export interface HasilImport {
  dry_run: boolean;
  nama_file: string;
  status: 'berhasil' | 'gagal';
  catatan: string | null;
  baris_sumber: number;
  baris_kosong_penuh: number;
  baris_kosong: number;
  baris_tidak_valid: number;
  baris_duplikat: number;
  baris_sudah_ada: number;
  baris_lolos: number;
  baris_dimuat: number;
  entitas_baru: EntitasBaru;
  sampel_ditolak: SampelDitolak[];
  total_data_setelah: number;
  min_baris_analisis: number;
  siap_dianalisis: boolean;
}

export interface RiwayatImport {
  id_import: string;
  nama_file: string;
  waktu: string;
  diimport_oleh: string | null;
  baris_sumber: number;
  baris_kosong: number;
  baris_tidak_valid: number;
  baris_duplikat: number;
  baris_sudah_ada: number;
  baris_dimuat: number;
  status: 'berhasil' | 'gagal';
  catatan: string | null;
}

export interface StatusData {
  total_baris: number;
  tanggal_awal: string | null;
  tanggal_akhir: string | null;
  min_baris_analisis: number;
  siap_dianalisis: boolean;
  import_terakhir: RiwayatImport | null;
}
