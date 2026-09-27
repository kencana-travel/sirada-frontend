/**
 * Tipe data respons API SIRADA Kencana.
 *
 * Nama field mengikuti konvensi backend FastAPI (snake_case, Bahasa Indonesia).
 * Sebagian field dibuat opsional agar UI tetap aman ketika backend belum
 * mengirim field tertentu (fallback ditangani di komponen).
 */

/* ============================ AUTH ============================ */

export type UserRole = 'Admin' | 'Owner' | 'KepalaOutlet';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  role: UserRole;
  nama?: string;
  email?: string;
}

export interface CurrentUser {
  nama: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  nama: string;
  email: string;
  password: string;
}

/** Respons generik endpoint auth (daftar, verifikasi, lupa & reset password). */
export interface PesanResponse {
  pesan: string;
}

/* ====================== MANAJEMEN PENGGUNA ====================== */

export type StatusPengguna = 'menunggu' | 'aktif' | 'ditolak';

export interface Pengguna {
  id_pengguna: string;
  nama: string;
  email: string;
  role: UserRole | ''; // kosong = pendaftar yang belum disetujui
  id_cabang?: string | null;
  email_terverifikasi: boolean;
  status: StatusPengguna;
  dibuat_pada?: string | null;
}

export interface CabangOption {
  id_cabang: string;
  nama_cabang: string;
}

export interface SetujuiPenggunaRequest {
  role: UserRole;
  id_cabang?: string;
}

/* =================== TREND / SHARED PRIMITIVES =================== */

export interface TrendPoint {
  label: string; // tanggal / periode
  aktual?: number | null;
  prediksi?: number | null;
}

/* ============================ DASHBOARD ============================ */

export interface DashboardSummary {
  total_transaksi: number;
  total_transaksi_perubahan_persen?: number;

  total_pendapatan: number;
  total_pendapatan_perubahan_persen?: number;

  rute_terlaris: string;
  rute_terlaris_okupansi_persen?: number;
  rute_terlaris_perubahan_persen?: number;

  rasio_member_persen: number; // % transaksi yang berasal dari member
  rasio_member_perubahan_persen?: number;

  // Opsional — dipakai untuk panel mini di dashboard bila tersedia.
  forecasting_deret?: TrendPoint[];
  okupansi_rute?: OkupansiRute[];
}

export interface DistribusiMemberItem {
  segmen: string; // "Member Mahasiswa" | "Member Umum" | "Non-Member" | ...
  jumlah: number;
  persen?: number;
}

export interface OkupansiRute {
  rute: string;
  okupansi_persen: number;
}

export interface AktivitasTransaksi {
  kode_booking: string;
  nama_penumpang: string;
  jenis_member: string; // "Member Mahasiswa" | "Member Umum" | "Non-Member"
  rute: string;
  armada?: string;
  jam_keberangkatan: string;
  total_bayar: number;
  status?: string; // "Lunas" | "Pending" | ... (belum dikirim backend)
}

/* ============================ TRANSAKSI ============================ */

export interface Transaksi {
  kode_transaksi: string;
  tanggal: string;
  jam: string;
  rute_asal: string;
  rute_tujuan: string;
  layanan: string; // "VIP" | "Reguler"
  channel: string; // "Aplikasi" | "Outlet"
  jenis_member: string;
  unit: number; // jumlah kursi / berat paket
  satuan?: string; // "Orang" | "Kg"
}

export interface TransaksiListResponse {
  data: Transaksi[];
  total: number;
  halaman: number;
  per_halaman: number;
  // ringkasan opsional untuk kartu kanan atas
  total_hari_ini?: number;
  omset_terverifikasi?: number;
}

export interface TransaksiQuery {
  cari?: string;
  rute?: string;
  layanan?: string;
  channel?: string;
  halaman?: number;
  per_halaman?: number;
}

/** Body POST /api/transaksi — sama persis dengan skema TransaksiCreate di backend. */
export interface TransaksiCreatePayload {
  tanggal: string;
  jam_keberangkatan: string;
  rute: string; // format backend: "Solo->Semarang"
  layanan: string;
  jenis_member: string;
  jumlah_unit: number;
  channel_pemesanan: string;
  nama_pelanggan?: string;
}

/* ============================ SEGMENTASI ============================ */

export interface SegmentasiRingkasanItem {
  jenis_member: string; // "Member Mahasiswa" | "Member Umum" | "Non-Member"
  share_persen: number;
  total_transaksi: number;
  total_transaksi_tren_persen?: number;
  total_pendapatan: number;
  rata_rata_transaksi: number; // rata-rata nilai per tiket
  rute_favorit: string;
}

export interface WawasanPelanggan {
  repeat_order_rate_persen?: number;
  jam_pemesanan_puncak?: string;
  preferensi_armada?: string;
  vip_preferensi_persen?: number;
  reguler_preferensi_persen?: number;
  perbandingan?: { label: string; persen: number }[];
}

export type StatusLoyalitas =
  | 'Tier Platinum'
  | 'Tier Gold'
  | 'Tier Silver'
  | 'Calon Member';

export interface Pelanggan {
  id: string | number;
  nama: string;
  email?: string;
  jenis_member?: string;
  total_transaksi: number;
  total_belanja: number;
  rata_rata_belanja?: number;
  rute_favorit?: string;
  status_loyalitas?: StatusLoyalitas | string;
}

export interface SegmentasiRingkasanResponse {
  segmen: SegmentasiRingkasanItem[];
  distribusi: DistribusiMemberItem[];
  wawasan?: WawasanPelanggan;
  pelanggan: Pelanggan[];
}

export interface ClusterRingkasan {
  cluster: number;
  label: string; // "Tier Platinum" | "Tier Gold" | ...
  jumlah_pelanggan: number;
  rata_recency_hari: number;
  rata_frequency: number;
  rata_monetary: number;
}

export interface ClusterResponse {
  ringkasan_cluster: ClusterRingkasan[];
  pelanggan: Pelanggan[];
}

/* ============================ FORECASTING ============================ */

export interface ForecastRunRequest {
  rute: string;
  horizon_hari: number;
  libur_akhir_pekan?: boolean;
}

export interface ForecastDeretPoint {
  tanggal: string;
  aktual?: number | null;
  prediksi?: number | null;
  puncak?: boolean;
}

export interface MatriksMuatanRute {
  rute: string;
  kapasitas_tersedia: number;
  prediksi_penumpang: number;
  load_factor_persen: number;
  rekomendasi_armada: string;
}

export interface ForecastRunResponse {
  prediksi_periode_berikutnya: number;
  prediksi_tren_persen?: number;
  akurasi_persen: number;
  mape_persen: number;
  rekomendasi_unit_tambahan: number;
  catatan_jadwal?: string;
  temuan_pola?: string;
  deret: ForecastDeretPoint[];
  matriks?: MatriksMuatanRute[];
}

/* ============================ PERFORMA RUTE ============================ */

export interface PerformaRute {
  rute: string;
  koridor?: string; // "Jawa Tengah" | "Pantura Timur"
  kategori?: string; // "Flagship" | "Reguler" | "Minimal"
  total_trip: number;
  total_transaksi: number;
  total_pendapatan: number;
  total_penumpang?: number;
  okupansi_persen: number;
  kontribusi_pendapatan_persen?: number;
  layanan_dominan: string;
  layanan_dominan_persen?: number;
  rekomendasi_tindakan?: string;
}

export interface VipVsRegulerKelas {
  kelas: string; // "VIP" | "Reguler"
  kontribusi_persen: number; // share pendapatan
  share_transaksi_persen?: number;
  rata_rata_harga: number;
  total_pendapatan?: number;
  margin_persen?: number; // belum dikirim backend
}

export interface VipVsRegulerResponse {
  kelas: VipVsRegulerKelas[];
}
