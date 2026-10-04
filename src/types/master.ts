/** Tipe Data Master (GET/POST/PUT/DELETE /api/master/...). */

export type LayananKelas = 'VIP' | 'Reguler';

export interface CabangMaster {
  id_cabang: string;
  nama_cabang: string;
  kota: string;
  jumlah_rute: number;
  jumlah_armada: number;
  /** true = cabang milik Kepala Outlet yang sedang login. */
  cabang_saya: boolean;
}

export interface RuteMaster {
  id_rute: string;
  nama_rute: string; // "Asal->Tujuan"
  cabang_asal: string;
  cabang_tujuan: string;
  layanan_tersedia: string; // "VIP" | "Reguler" | "Reguler,VIP"
  jumlah_jadwal: number;
  jumlah_transaksi: number;
}

export interface RuteInput {
  cabang_asal: string;
  cabang_tujuan: string;
  layanan_tersedia: LayananKelas[];
}

export interface ArmadaMaster {
  id_armada: string;
  kode_armada: string;
  jenis_kendaraan: string;
  tipe_layanan: LayananKelas | string;
  kapasitas: number;
  basis_outlet: string | null;
}

export interface ArmadaInput {
  kode_armada: string;
  jenis_kendaraan: string;
  tipe_layanan: LayananKelas;
  kapasitas: number;
  basis_outlet: string;
}

export interface JadwalMaster {
  id_jadwal: string;
  id_rute: string;
  nama_rute: string;
  cabang_asal: string;
  jam_keberangkatan: string; // HH:MM
  layanan: LayananKelas | string;
  hari_berlaku: string | null;
}

export interface JadwalInput {
  id_rute: string;
  jam_keberangkatan: string;
  layanan: LayananKelas;
  hari_berlaku: string;
}
