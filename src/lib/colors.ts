/** Palet warna konsisten untuk chart Recharts. */

export const BRAND = {
  maroon: '#7A1F2B',
  maroonLight: '#A83A49',
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
  blue: '#2563EB',
  purple: '#7C3AED',
  slate: '#64748B',
};

/** Warna donut segmentasi (mengikuti urutan segmen umum). */
export const SEGMENT_COLORS = ['#7A1F2B', '#2563EB', '#94A3B8', '#F59E0B', '#7C3AED'];

/** Ambil warna berdasarkan nama segmen agar konsisten lintas halaman. */
export function segmentColor(segmen: string, index: number): string {
  const v = segmen.toLowerCase();
  if (v.includes('mahasiswa')) return '#2563EB';
  if (v.includes('umum')) return '#7A1F2B';
  if (v.includes('non')) return '#94A3B8';
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}
