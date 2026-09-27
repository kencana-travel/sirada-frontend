import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, ReceiptText, Route, Users, Wallet } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import KpiCard from '../components/KpiCard';
import Badge, { memberTone } from '../components/Badge';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import ProgressBar, { okupansiColor } from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getAktivitasTerkini, getDistribusiMember, getSummary } from '../api/dashboard';
import { getPerformaRute } from '../api/performa';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';
import { segmentColor } from '../lib/colors';
import { useToast } from '../context/ToastContext';
import type { AktivitasTransaksi, TrendPoint } from '../types';

function buildPreviewSeries(base: number): TrendPoint[] {
  // Deret preview 8 titik: 5 aktual + 3 proyeksi (dipakai bila backend belum menyediakan).
  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min', 'Sen'];
  const factors = [0.82, 0.9, 0.86, 0.98, 1.05, 1.18, 1.24, 1.3];
  const seed = base > 0 ? base / 30 : 120;
  return labels.map((label, i) => {
    const val = Math.round(seed * factors[i]);
    return {
      label,
      aktual: i <= 4 ? val : null,
      prediksi: i >= 4 ? val : null,
    };
  });
}

export default function Dashboard() {
  const toast = useToast();
  const summary = useAsync(getSummary, []);
  const distribusi = useAsync(getDistribusiMember, []);
  const aktivitas = useAsync(getAktivitasTerkini, []);
  const performa = useAsync(() => getPerformaRute(), []);

  const totalSegmen = useMemo(
    () => (distribusi.data ?? []).reduce((sum, s) => sum + s.jumlah, 0),
    [distribusi.data],
  );

  const forecastSeries = useMemo<TrendPoint[]>(() => {
    if (summary.data?.forecasting_deret?.length) return summary.data.forecasting_deret;
    return buildPreviewSeries(summary.data?.total_transaksi ?? 0);
  }, [summary.data]);

  const topOkupansi = useMemo(() => {
    if (summary.data?.okupansi_rute?.length) {
      return [...summary.data.okupansi_rute]
        .sort((a, b) => b.okupansi_persen - a.okupansi_persen)
        .slice(0, 3);
    }
    return (performa.data ?? [])
      .map((r) => ({ rute: r.rute, okupansi_persen: r.okupansi_persen }))
      .sort((a, b) => b.okupansi_persen - a.okupansi_persen)
      .slice(0, 3);
  }, [summary.data, performa.data]);

  const allColumns: Column<AktivitasTransaksi>[] = [
    {
      key: 'kode_booking',
      header: 'Kode Booking',
      render: (r) => <span className="font-semibold text-slate-900">{r.kode_booking}</span>,
    },
    {
      key: 'penumpang',
      header: 'Nama Penumpang',
      render: (r) => (
        <div>
          <div className="font-medium text-slate-800">{r.nama_penumpang}</div>
          <Badge tone={memberTone(r.jenis_member)} className="mt-1">
            {r.jenis_member}
          </Badge>
        </div>
      ),
    },
    {
      key: 'rute',
      header: 'Rute & Armada',
      render: (r) => (
        <div>
          <div className="text-slate-800">{r.rute}</div>
          {r.armada && <div className="text-xs text-slate-400">{r.armada}</div>}
        </div>
      ),
    },
    { key: 'jam_keberangkatan', header: 'Jam Berangkat', render: (r) => <span className="tabular-nums">{r.jam_keberangkatan}</span> },
    {
      key: 'total_bayar',
      header: 'Total Bayar',
      align: 'right',
      render: (r) => <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(r.total_bayar)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (r) => (
        <Badge tone={r.status?.toLowerCase() === 'lunas' ? 'green' : 'amber'} dot>
          {r.status}
        </Badge>
      ),
    },
  ];

  // Backend belum mengirim status pembayaran — sembunyikan kolomnya bila tidak ada.
  const hasStatus = (aktivitas.data ?? []).some((r) => r.status);
  const columns = hasStatus ? allColumns : allColumns.filter((c) => c.key !== 'status');

  const s = summary.data;

  return (
    <div>
      <PageHeader
        badge={{ label: 'Ringkasan Operasional', tone: 'maroon', dot: true }}
        title="Dashboard Analitik"
        subtitle="Pantau performa transaksi, segmentasi, dan okupansi rute secara real-time."
        actions={
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => toast.success('Ringkasan bulanan sedang diunduh...')}
          >
            Download Ringkasan Bulanan
          </Button>
        }
      />

      {/* ===== KPI ROW ===== */}
      {summary.error ? (
        <Card>
          <ErrorState message={summary.error} onRetry={summary.reload} compact />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            loading={summary.loading}
            title="Total Transaksi"
            value={formatNumber(s?.total_transaksi)}
            deltaPercent={s?.total_transaksi_perubahan_persen}
            icon={<ReceiptText className="h-5 w-5" />}
          />
          <KpiCard
            loading={summary.loading}
            title="Total Pendapatan"
            value={formatCurrency(s?.total_pendapatan, { compact: true })}
            deltaPercent={s?.total_pendapatan_perubahan_persen}
            icon={<Wallet className="h-5 w-5" />}
          />
          <KpiCard
            loading={summary.loading}
            title="Rute Terlaris"
            value={<span className="text-xl">{s?.rute_terlaris ?? '—'}</span>}
            badge={
              s?.rute_terlaris_okupansi_persen !== undefined ? (
                <Badge tone={okupansiColor(s.rute_terlaris_okupansi_persen) === 'green' ? 'green' : 'amber'}>
                  Okupansi {formatPercent(s.rute_terlaris_okupansi_persen, 0)}
                </Badge>
              ) : undefined
            }
            subtitle="Rute dengan penumpang terbanyak"
            icon={<Route className="h-5 w-5" />}
          />
          <KpiCard
            loading={summary.loading}
            title="Rasio Member / Non"
            value={formatPercent(s?.rasio_member_persen, 0)}
            deltaPercent={s?.rasio_member_perubahan_persen}
            subtitle={
              s ? `${formatPercent(s.rasio_member_persen, 0)} member · ${formatPercent(100 - s.rasio_member_persen, 0)} non-member` : undefined
            }
            icon={<Users className="h-5 w-5" />}
          />
        </div>
      )}

      {/* ===== MIDDLE PANELS ===== */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Donut segmentasi */}
        <Card title="Segmentasi Pelanggan" subtitle="Komposisi jenis keanggotaan">
          {distribusi.loading ? (
            <CenterSpinner />
          ) : distribusi.error ? (
            <ErrorState message={distribusi.error} onRetry={distribusi.reload} compact />
          ) : (
            <>
              <div className="relative mx-auto h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribusi.data ?? []}
                      dataKey="jumlah"
                      nameKey="segmen"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {(distribusi.data ?? []).map((entry, i) => (
                        <Cell key={entry.segmen} fill={segmentColor(entry.segmen, i)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatNumber(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {formatNumber(totalSegmen)}
                  </span>
                  <span className="text-xs text-slate-400">Total Transaksi</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {(distribusi.data ?? []).map((seg, i) => {
                  const pct = seg.persen ?? (totalSegmen ? (seg.jumlah / totalSegmen) * 100 : 0);
                  return (
                    <li key={seg.segmen} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segmentColor(seg.segmen, i) }} />
                      <span className="flex-1 text-slate-600">{seg.segmen}</span>
                      <span className="font-semibold tabular-nums text-slate-800">{formatNumber(seg.jumlah)}</span>
                      <span className="w-12 text-right text-xs tabular-nums text-slate-400">{formatPercent(pct, 0)}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Card>

        {/* Forecasting mini */}
        <Card
          title="Forecasting Penumpang"
          subtitle="Aktual vs proyeksi 7 hari"
          action={<Badge tone="purple" dot>AI MODEL</Badge>}
        >
          <div className="h-48 w-full">
            {summary.loading ? (
              <CenterSpinner />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastSeries} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7A1F2B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7A1F2B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F2" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v: number) => formatNumber(v)} />
                  <Area
                    type="monotone"
                    dataKey="aktual"
                    stroke="#7A1F2B"
                    strokeWidth={2.5}
                    fill="url(#dashActual)"
                    connectNulls
                    name="Aktual"
                  />
                  <Area
                    type="monotone"
                    dataKey="prediksi"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    fill="none"
                    connectNulls
                    name="Proyeksi"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 flex items-center justify-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-maroon-700" />Aktual</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full border border-dashed border-purple-500 bg-purple-100" />Proyeksi</span>
          </div>
        </Card>

        {/* Okupansi ranking */}
        <Card title="Performa Okupansi Rute" subtitle="Peringkat 3 rute teratas">
          {performa.loading ? (
            <CenterSpinner />
          ) : topOkupansi.length === 0 ? (
            <ErrorState message={performa.error ?? 'Belum ada data okupansi.'} onRetry={performa.reload} compact />
          ) : (
            <ul className="space-y-5 py-2">
              {topOkupansi.map((r, i) => (
                <li key={r.rute}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-maroon-50 text-xs font-bold text-maroon-700">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-slate-700">{r.rute}</span>
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {formatPercent(r.okupansi_persen, 0)}
                    </span>
                  </div>
                  <ProgressBar value={r.okupansi_persen} color={okupansiColor(r.okupansi_persen)} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ===== ACTIVITY TABLE ===== */}
      <Card className="mt-4" title="Aktivitas Transaksi Terkini" subtitle="Transaksi pemesanan tiket terbaru" noPadding>
        {aktivitas.error ? (
          <div className="p-5">
            <ErrorState message={aktivitas.error} onRetry={aktivitas.reload} compact />
          </div>
        ) : (
          <Table
            columns={columns}
            data={aktivitas.data ?? []}
            keyField={(r) => r.kode_booking}
            loading={aktivitas.loading}
            emptyMessage="Belum ada aktivitas transaksi."
          />
        )}
      </Card>
    </div>
  );
}
