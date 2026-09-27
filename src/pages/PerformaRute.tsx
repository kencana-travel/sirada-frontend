import { useMemo } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Trophy } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge, { layananTone, type BadgeTone } from '../components/Badge';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import ProgressBar, { okupansiColor } from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getPerformaRute, getVipVsReguler } from '../api/performa';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';
import { BRAND } from '../lib/colors';
import { useToast } from '../context/ToastContext';
import type { PerformaRute as PerformaRuteType } from '../types';

function kategoriTone(kategori?: string): BadgeTone {
  const v = (kategori ?? '').toLowerCase();
  if (v.includes('flagship')) return 'maroon';
  if (v.includes('minimal')) return 'slate';
  return 'blue';
}

const KELAS_COLORS: Record<string, string> = { vip: BRAND.maroon, reguler: BRAND.blue };
function kelasColor(kelas: string) {
  return kelas.toLowerCase().includes('vip') ? KELAS_COLORS.vip : KELAS_COLORS.reguler;
}

export default function PerformaRute() {
  const toast = useToast();
  const performa = useAsync(getPerformaRute, []);
  const vip = useAsync(getVipVsReguler, []);
  const hasMargin = (vip.data?.kelas ?? []).some((k) => k.margin_persen !== undefined);

  const rows = performa.data ?? [];

  const { top, low } = useMemo(() => {
    if (rows.length === 0) return { top: null, low: null };
    const sorted = [...rows].sort((a, b) => b.okupansi_persen - a.okupansi_persen);
    return { top: sorted[0], low: sorted[sorted.length - 1] };
  }, [rows]);

  const totalPendapatan = useMemo(() => rows.reduce((s, r) => s + r.total_pendapatan, 0), [rows]);
  const totalPax = useMemo(() => rows.reduce((s, r) => s + (r.total_penumpang ?? 0), 0), [rows]);

  const columns: Column<PerformaRuteType>[] = [
    { key: 'rute', header: 'Nama Rute', render: (r) => <span className="font-semibold text-slate-800">{r.rute}</span> },
    { key: 'total_trip', header: 'Total Trip', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.total_trip)}</span> },
    { key: 'total_transaksi', header: 'Transaksi', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.total_transaksi)}</span> },
    {
      key: 'total_pendapatan',
      header: 'Total Pendapatan',
      align: 'right',
      render: (r) => <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(r.total_pendapatan, { compact: true })}</span>,
    },
    {
      key: 'okupansi',
      header: 'Rata-rata Okupansi',
      render: (r) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={r.okupansi_persen} color={okupansiColor(r.okupansi_persen)} height="sm" className="min-w-[80px]" />
          <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-700">{formatPercent(r.okupansi_persen, 0)}</span>
        </div>
      ),
    },
    {
      key: 'layanan_dominan',
      header: 'Layanan Dominan',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge tone={layananTone(r.layanan_dominan)}>{r.layanan_dominan}</Badge>
          {r.layanan_dominan_persen !== undefined && (
            <span className="text-xs text-slate-400">{formatPercent(r.layanan_dominan_persen, 0)}</span>
          )}
        </span>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'center',
      render: (r) => {
        const low = r.okupansi_persen < 50;
        return (
          <Button
            size="sm"
            variant={low ? 'danger' : 'outline'}
            onClick={() =>
              toast.info(low ? `Membuka rekomendasi optimasi untuk ${r.rute}...` : `Menganalisis performa ${r.rute}...`)
            }
          >
            {low ? 'Optimasi' : 'Analisis'}
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        badge={{ label: 'Live Sync', tone: 'green', dot: true }}
        title="Analisis Performa Rute & Efisiensi Armada"
        subtitle="Bandingkan kontribusi, okupansi, dan profitabilitas tiap rute utama."
      />

      {performa.error ? (
        <Card>
          <ErrorState message={performa.error} onRetry={performa.reload} />
        </Card>
      ) : (
        <>
          {/* ===== ALERT CARDS ===== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {performa.loading ? (
              <>
                <Card><CenterSpinner /></Card>
                <Card><CenterSpinner /></Card>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-card">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-600 text-white"><Trophy className="h-5 w-5" /></span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-green-700">Top Performer</div>
                      <div className="text-lg font-bold text-slate-900">{top?.rute ?? '—'}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <AlertStat label="Kontribusi" value={formatPercent(top?.kontribusi_pendapatan_persen ?? (totalPendapatan && top ? (top.total_pendapatan / totalPendapatan) * 100 : 0), 0)} />
                    <AlertStat label="Okupansi" value={formatPercent(top?.okupansi_persen ?? 0, 0)} />
                    <AlertStat label="Penumpang" value={formatNumber(top?.total_penumpang ?? top?.total_transaksi ?? 0)} />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-card">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500 text-white"><AlertTriangle className="h-5 w-5" /></span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Low Load Factor</div>
                      <div className="text-lg font-bold text-slate-900">{low?.rute ?? '—'}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="text-3xl font-extrabold tabular-nums text-amber-600">{formatPercent(low?.okupansi_persen ?? 0, 0)}</div>
                      <div className="text-xs text-slate-500">okupansi rata-rata</div>
                    </div>
                    <div className="flex-1 rounded-lg border border-amber-200 bg-white/70 p-3 text-xs text-slate-600">
                      <span className="font-semibold text-amber-700">Rekomendasi: </span>
                      {low?.rekomendasi_tindakan ?? 'Tinjau frekuensi keberangkatan & promosikan paket bundling untuk menaikkan okupansi.'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ===== DISTRIBUSI + VIP VS REGULER ===== */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Distribusi Beban Volume & Pendapatan Rute Utama" subtitle="Kontribusi tiap rute terhadap total">
              {performa.loading ? (
                <CenterSpinner />
              ) : (
                <>
                  <ul className="space-y-4">
                    {rows.map((r) => {
                      const pct = r.kontribusi_pendapatan_persen ?? (totalPendapatan ? (r.total_pendapatan / totalPendapatan) * 100 : 0);
                      return (
                        <li key={r.rute}>
                          <div className="mb-1.5 flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-700">{r.rute}</span>
                            <Badge tone={kategoriTone(r.kategori)}>{r.kategori ?? 'Reguler'}</Badge>
                            <span className="ml-auto text-xs text-slate-400">
                              {formatNumber(r.total_penumpang ?? r.total_transaksi)} pax · {formatCurrency(r.total_pendapatan, { compact: true })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ProgressBar value={pct} color="maroon" />
                            <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-600">{formatPercent(pct, 0)}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-sm">
                    <span className="font-semibold text-slate-500">Total Kumulatif</span>
                    <span className="font-bold tabular-nums text-slate-900">
                      {formatNumber(totalPax)} pax · {formatCurrency(totalPendapatan, { compact: true })}
                    </span>
                  </div>
                </>
              )}
            </Card>

            <Card
              title="Perbandingan Layanan VIP vs Reguler"
              subtitle={hasMargin ? 'Kontribusi, harga & margin per kelas' : 'Kontribusi pendapatan & harga per kelas'}
            >
              {vip.loading ? (
                <CenterSpinner />
              ) : vip.error ? (
                <ErrorState message={vip.error} onRetry={vip.reload} compact />
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-5">
                    <div className="h-36 w-36 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={vip.data?.kelas ?? []} dataKey="kontribusi_persen" nameKey="kelas" innerRadius={44} outerRadius={66} paddingAngle={2} stroke="none">
                            {(vip.data?.kelas ?? []).map((k) => (
                              <Cell key={k.kelas} fill={kelasColor(k.kelas)} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatPercent(v, 0)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="flex-1 space-y-2 text-sm">
                      {(vip.data?.kelas ?? []).map((k) => (
                        <li key={k.kelas} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: kelasColor(k.kelas) }} />
                            {k.kelas}
                          </span>
                          <span className="font-semibold tabular-nums text-slate-800">{formatPercent(k.kontribusi_persen, 0)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rata-rata harga tiket per kelas */}
                  <div className="overflow-hidden rounded-lg border border-hairline">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2 text-left font-semibold">Kelas</th>
                          <th className="px-3 py-2 text-right font-semibold">Rata-rata Harga</th>
                          {hasMargin ? (
                            <th className="px-3 py-2 text-right font-semibold">Margin</th>
                          ) : (
                            <th className="px-3 py-2 text-right font-semibold">Pendapatan</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(vip.data?.kelas ?? []).map((k) => (
                          <tr key={k.kelas} className="border-t border-hairline">
                            <td className="px-3 py-2 font-medium text-slate-700">{k.kelas}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatCurrency(k.rata_rata_harga)}</td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                              {hasMargin
                                ? formatPercent(k.margin_persen ?? 0, 0)
                                : formatCurrency(k.total_pendapatan ?? 0, { compact: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bar margin profitabilitas (hanya bila backend mengirim margin) */}
                  {hasMargin && <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">Margin Profitabilitas per Kelas</p>
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vip.data?.kelas ?? []} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                          <XAxis dataKey="kelas" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip formatter={(v: number) => formatPercent(v, 0)} cursor={{ fill: '#F8F9FA' }} />
                          <Bar dataKey="margin_persen" radius={[6, 6, 0, 0]} maxBarSize={56}>
                            {(vip.data?.kelas ?? []).map((k) => (
                              <Cell key={k.kelas} fill={kelasColor(k.kelas)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>}
                </div>
              )}
            </Card>
          </div>

          {/* ===== TABEL DETAIL ===== */}
          <Card className="mt-4" title="Detail Performa 6 Rute Utama" subtitle="Metrik lengkap per rute" noPadding>
            <Table
              columns={columns}
              data={rows}
              keyField={(r) => r.rute}
              loading={performa.loading}
              emptyMessage="Belum ada data performa rute."
            />
          </Card>
        </>
      )}
    </div>
  );
}

function AlertStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-2.5 text-center ring-1 ring-inset ring-black/5">
      <div className="text-base font-bold tabular-nums text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
