/** Tipe data fitur Laporan & Permintaan Laporan (lihat backend app/schemas/laporan.py). */

export type JenisLaporan = 'ringkasan' | 'performa' | 'segmentasi' | 'forecasting';
export type FormatLaporan = 'pdf' | 'xlsx';
export type StatusPermintaan = 'menunggu' | 'selesai' | 'ditolak';

export interface ParamLaporan {
  jenis: JenisLaporan;
  format: FormatLaporan;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  cabang?: string;
}

export interface OpsiLaporan {
  cabang: string[];
  /** Terisi untuk Kepala Outlet: laporan selalu dibatasi ke cabang ini. */
  cabang_terkunci: string | null;
  jenis: { value: JenisLaporan; label: string }[];
}

export interface PermintaanLaporan {
  id_permintaan: string;
  id_pemohon: string;
  nama_pemohon: string | null;
  role_pemohon: string | null;
  jenis_laporan: JenisLaporan;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  cabang: string | null;
  catatan: string | null;
  status: StatusPermintaan;
  catatan_admin: string | null;
  diproses_oleh: string | null;
  nama_pemroses: string | null;
  dibuat_pada: string;
  diproses_pada: string | null;
}

export interface PermintaanCreate {
  jenis_laporan: JenisLaporan;
  tanggal_mulai?: string | null;
  tanggal_selesai?: string | null;
  cabang?: string | null;
  catatan?: string | null;
}

export interface PermintaanProses {
  status: 'selesai' | 'ditolak';
  catatan_admin?: string | null;
}
