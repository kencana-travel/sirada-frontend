import { useMemo, useState } from 'react';
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
import { getAktivitasTerkini, getDistribusiMember, getSummary, getTrenPenumpang } from '../api/dashboard';
import { getPerformaRute } from '../api/performa';
import { downloadTransaksiCsv } from '../api/transaksi';
import { getErrorMessage } from '../api/client';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';
import { segmentColor } from '../lib/colors';
import { useToast } from '../context/ToastContext';
import type { AktivitasTransaksi } from '../types';

const HARI_TREN = 14;

function labelTanggal(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** Tanggal pertama pada bulan dari tanggal ISO (YYYY-MM-DD). */
function awalBulan(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export default function Dashboard() {
  const toast = useToast();
  const summary = useAsync(getSummary, []);
  const distribusi = useAsync(getDistribusiMember, []);
  const aktivitas = useAsync(getAktivitasTerkini, []);
  const performa = useAsync(() => getPerformaRute(), []);
  const tren = useAsync(() => getTrenPenumpang(HARI_TREN), []);
  const [mengunduh, setMengunduh] = useState(false);

  const totalSegmen = useMemo(
    () => (distribusi.data ?? []).reduce((sum, s) => sum + s.jumlah, 0),
    [distribusi.data],
  );

  const trenSeries = useMemo(
    () => (tren.data ?? []).map((t) => ({ label: labelTanggal(t.tanggal), penumpang: t.penumpang })),
    [tren.data],
  );
  const tanggalTerakhir = tren.data?.length ? tren.data[tren.data.length - 1].tanggal : undefined;

  const topOkupansi = useMemo(
    () =>
      (performa.data ?? [])
        .map((r) => ({ rute: r.rute, okupansi_persen: r.okupansi_persen }))
        .sort((a, b) => b.okupansi_persen - a.okupansi_persen)
        .slice(0, 3),
    [performa.data],
  );

  const okupansiRuteTerlaris = useMemo(
    () => (performa.data ?? []).find((r) => r.rute === summary.data?.rute_terlaris)?.okupansi_persen,
    [performa.data, summary.data],
  );

  /** Unduh CSV transaksi pada bulan terakhir yang ada datanya (Kepala Outlet: cabangnya saja). */
  const unduhBulanTerakhir = async () => {
    if (!tanggalTerakhir) return;
    setMengunduh(true);
    try {
      const mulai = awalBulan(tanggalTerakhir);
      const cabang = summary.data?.cabang;
      await downloadTransaksiCsv(
        { tanggal_mulai: mulai, tanggal_selesai: tanggalTerakhir },
        `transaksi_${tanggalTerakhir.slice(0, 7)}${cabang ? `_${cabang.toLowerCase()}` : ''}.csv`,
      );
      toast.success(`Transaksi ${labelTanggal(mulai)} – ${labelTanggal(tanggalTerakhir)} berhasil diunduh.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengunduh transaksi.'));
    } finally {
      setMengunduh(false);
    }
  };

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
    {
      key: 'jam_keberangkatan',
      header: 'Keberangkatan',
      render: (r) => (
        <span className="tabular-nums">
          {r.tanggal && <span className="text-slate-400">{labelTanggal(r.tanggal)} · </span>}
          {r.jam_keberangkatan}
        </span>
      ),
    },
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
        badge={{
          label: s?.cabang ? `Ringkasan Cabang ${s.cabang}` : 'Ringkasan Operasional',
          tone: 'maroon',
          dot: true,
        }}
        title="Dashboard Analitik"
        subtitle={
          s?.cabang
            ? `Pantau transaksi, segmentasi, dan okupansi rute yang berangkat dari cabang ${s.cabang}.`
            : 'Pantau performa transaksi, segmentasi, dan okupansi rute seluruh cabang.'
        }
        actions={
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            loading={mengunduh}
            disabled={!tanggalTerakhir}
            onClick={unduhBulanTerakhir}
            title="Unduh CSV transaksi pada bulan terakhir yang ada datanya"
          >
            Unduh Transaksi Bulan Terakhir
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
              okupansiRuteTerlaris !== undefined ? (
                <Badge tone={okupansiColor(okupansiRuteTerlaris) === 'green' ? 'green' : 'amber'}>
                  Okupansi {formatPercent(okupansiRuteTerlaris, 0)}
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

        {/* Tren penumpang harian (data aktual) */}
        <Card
          title="Tren Penumpang Harian"
          subtitle={
            tanggalTerakhir
              ? `${HARI_TREN} hari terakhir data · s.d. ${labelTanggal(tanggalTerakhir)}`
              : `${HARI_TREN} hari terakhir data`
          }
        >
          <div className="h-48 w-full">
            {tren.loading ? (
              <CenterSpinner />
            ) : tren.error ? (
              <ErrorState message={tren.error} onRetry={tren.reload} compact />
            ) : trenSeries.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400">Belum ada data penumpang.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trenSeries} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7A1F2B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7A1F2B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F2" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} minTickGap={12} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip formatter={(v: number) => [formatNumber(v), 'Penumpang']} />
                  <Area type="monotone" dataKey="penumpang" stroke="#7A1F2B" strokeWidth={2.5} fill="url(#dashActual)" name="Penumpang" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Jumlah penumpang per hari. Prediksi tersedia di menu Forecasting.
          </p>
        </Card>

        {/* Okupansi ranking */}
        <Card title="Performa Okupansi Rute" subtitle="Peringkat 3 rute teratas (rata-rata per trip)">
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
