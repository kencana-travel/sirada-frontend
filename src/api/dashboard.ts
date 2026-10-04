import api from './client';
import type {
  AktivitasTransaksi,
  DashboardSummary,
  DistribusiMemberItem,
  TrenHarian,
} from '../types';

/* --- Bentuk respons mentah dari backend FastAPI --- */

interface DistribusiMemberRaw {
  jenis_member: string | null;
  jumlah: number;
  persen?: number;
}

interface AktivitasRaw {
  id_transaksi: string;
  tanggal?: string;
  nama_pelanggan: string | null;
  nama_rute: string;
  jam_keberangkatan: string;
  total_bayar: number;
  jenis_member: string | null;
}

/** GET /api/dashboard/summary — 4 KPI utama dashboard. */
export async function getSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/api/dashboard/summary');
  return data;
}

/** GET /api/dashboard/distribusi-member — data donut segmentasi pelanggan. */
export async function getDistribusiMember(): Promise<DistribusiMemberItem[]> {
  const { data } = await api.get<DistribusiMemberRaw[]>('/api/dashboard/distribusi-member');
  return data.map((d) => ({
    segmen: d.jenis_member ?? '-',
    jumlah: d.jumlah,
    persen: d.persen,
  }));
}

/** GET /api/dashboard/aktivitas-terkini — tabel aktivitas transaksi terbaru. */
export async function getAktivitasTerkini(): Promise<AktivitasTransaksi[]> {
  const { data } = await api.get<AktivitasRaw[]>('/api/dashboard/aktivitas-terkini');
  return data.map((r) => ({
    kode_booking: r.id_transaksi,
    tanggal: r.tanggal,
    nama_penumpang: r.nama_pelanggan ?? '-',
    jenis_member: r.jenis_member ?? '-',
    rute: r.nama_rute,
    jam_keberangkatan: r.jam_keberangkatan,
    total_bayar: r.total_bayar,
  }));
}

/** GET /api/dashboard/tren-penumpang — penumpang per hari untuk N hari terakhir yang ada datanya. */
export async function getTrenPenumpang(hari = 14): Promise<TrenHarian[]> {
  const { data } = await api.get<TrenHarian[]>('/api/dashboard/tren-penumpang', { params: { hari } });
  return data;
}
