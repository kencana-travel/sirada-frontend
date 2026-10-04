import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarRange, Database, Route as RouteIcon, Users, Wallet } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import KpiCard from '../components/KpiCard';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import ProgressBar from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getEda } from '../api/eda';
import { classNames, formatCompact, formatCurrency, formatDelta, formatNumber, formatPercent } from '../lib/format';
import { BRAND } from '../lib/colors';
import { useToast } from '../context/ToastContext';
import type {
  EdaDistribusiItem,
  EdaEfekKalender,
  EdaFilter,
  EdaKategoriDistribusi,
  EdaKelengkapan,
  EdaStatistik,
} from '../types/eda';

const fieldClass =
  'h-10 rounded-lg border border-hairline bg-white px-3 text-sm text-slate-800 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100';

const TAB_DISTRIBUSI: { key: EdaKategoriDistribusi; label: string }[] = [
  { key: 'rute', label: 'Rute' },
  { key: 'layanan', label: 'Layanan' },
  { key: 'channel_pemesanan', label: 'Channel Pemesanan' },
  { key: 'jenis_member', label: 'Jenis Member' },
  { key: 'jenis_transaksi', label: 'Jenis Transaksi' },
];

const WARNA_DISTRIBUSI = [BRAND.maroon, BRAND.blue, BRAND.amber, BRAND.green, BRAND.purple, BRAND.slate, BRAND.maroonLight];

const NAMA_VARIABEL: Record<string, string> = {
  jumlah_unit: 'Jumlah penumpang',
  total_bayar: 'Total bayar',
  harga_satuan: 'Harga tiket',
};

function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Nilai statistik: rupiah untuk kolom uang, angka biasa untuk jumlah penumpang. */
function formatStat(variabel: string, v: number | null): string {
  if (v === null || v === undefined) return '—';
  if (variabel === 'jumlah_unit') return v.toLocaleString('id-ID', { maximumFractionDigits: 2 });
  return formatCurrency(v);
}

export default function EksplorasiData() {
  const toast = useToast();
  const [form, setForm] = useState<EdaFilter>({});
  const [filter, setFilter] = useState<EdaFilter>({});
  const [tabDistribusi, setTabDistribusi] = useState<EdaKategoriDistribusi>('rute');

  const { data, loading, error, reload } = useAsync(
    () => getEda(filter),
    [filter.tanggal_mulai, filter.tanggal_selesai],
  );

  const terapkan = () => {
    if (form.tanggal_mulai && form.tanggal_selesai && form.tanggal_mulai > form.tanggal_selesai) {
      toast.error('Tanggal mulai tidak boleh setelah tanggal selesai.');
      return;
    }
    setFilter({ ...form });
  };
  const reset = () => {
    setForm({});
    setFilter({});
  };

  const ringkasan = data?.ringkasan;
  const distribusi: EdaDistribusiItem[] = data?.distribusi?.[tabDistribusi] ?? [];
  const adaFilter = Boolean(filter.tanggal_mulai || filter.tanggal_selesai);

  const kolomStatistik: Column<EdaStatistik>[] = [
    {
      key: 'variabel',
      header: 'Variabel',
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-800">{NAMA_VARIABEL[s.variabel] ?? s.variabel}</div>
          <div className="text-xs text-slate-400">{s.keterangan}</div>
        </div>
      ),
    },
    { key: 'count', header: 'Count', align: 'right', render: (s) => <span className="tabular-nums">{formatNumber(s.count)}</span> },
    { key: 'mean', header: 'Mean', align: 'right', render: (s) => <span className="tabular-nums">{formatStat(s.variabel, s.mean)}</span> },
    { key: 'std', header: 'Std', align: 'right', render: (s) => <span className="tabular-nums">{formatStat(s.variabel, s.std)}</span> },
    { key: 'min', header: 'Min', align: 'right', render: (s) => <span className="tabular-nums">{formatStat(s.variabel, s.min)}</span> },
    { key: 'q1', header: 'Q1', align: 'right', render: (s) => <span className="tabular-nums">{formatStat(s.variabel, s.q1)}</span> },
    { key: 'median', header: 'Median', align: 'right', render: (s) => <span className="font-semibold tabular-nums">{formatStat(s.variabel, s.median)}</span> },
    { key: 'q3', header: 'Q3', align: 'right', render: (s) => <span className="tabular-nums">{formatStat(s.variabel, s.q3)}</span> },
    { key: 'max', header: 'Max', align: 'right', render: (s) => <span className="tabular-nums">{formatStat(s.variabel, s.max)}</span> },
  ];

  const kolomKelengkapan: Column<EdaKelengkapan>[] = [
    { key: 'kolom', header: 'Kolom', render: (k) => <code className="text-xs font-semibold text-slate-700">{k.kolom}</code> },
    { key: 'terisi', header: 'Terisi', align: 'right', render: (k) => <span className="tabular-nums">{formatNumber(k.terisi)}</span> },
    { key: 'kosong', header: 'Kosong (NULL)', align: 'right', render: (k) => <span className={classNames('tabular-nums', k.kosong > 0 ? 'font-semibold text-amber-700' : 'text-slate-400')}>{formatNumber(k.kosong)}</span> },
    {
      key: 'persen',
      header: '% Kosong',
      align: 'right',
      render: (k) =>
        k.kosong === 0 ? <Badge tone="green">Lengkap</Badge> : <Badge tone="amber">{formatPercent(k.persen_kosong, 2)}</Badge>,
    },
  ];

  const kolomDistribusi: Column<EdaDistribusiItem>[] = [
    {
      key: 'kategori',
      header: 'Kategori',
      render: (d, i) => (
        <span className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: WARNA_DISTRIBUSI[i % WARNA_DISTRIBUSI.length] }} />
          {d.kategori}
        </span>
      ),
    },
    { key: 'transaksi', header: 'Transaksi', align: 'right', render: (d) => <span className="tabular-nums">{formatNumber(d.transaksi)}</span> },
    { key: 'penumpang', header: 'Penumpang', align: 'right', render: (d) => <span className="tabular-nums">{formatNumber(d.penumpang)}</span> },
    { key: 'pendapatan', header: 'Pendapatan', align: 'right', render: (d) => <span className="tabular-nums">{formatCurrency(d.pendapatan, { compact: true })}</span> },
    {
      key: 'persen',
      header: '% Transaksi',
      render: (d) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={d.persen_transaksi} height="sm" className="min-w-[70px]" />
          <span className="w-12 text-right text-xs font-semibold tabular-nums text-slate-700">{formatPercent(d.persen_transaksi, 1)}</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb={['Analitik', 'Eksplorasi Data']}
        title="Eksplorasi Data (EDA)"
        subtitle="Gambaran awal dataset transaksi: ukuran, kelengkapan, statistik deskriptif, tren, pola kalender, dan distribusi kategori."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Dari
              <input
                type="date"
                value={form.tanggal_mulai ?? ''}
                max={form.tanggal_selesai || undefined}
                onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value || undefined })}
                className={classNames(fieldClass, 'mt-1 block')}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Sampai
              <input
                type="date"
                value={form.tanggal_selesai ?? ''}
                min={form.tanggal_mulai || undefined}
                onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value || undefined })}
                className={classNames(fieldClass, 'mt-1 block')}
              />
            </label>
            <Button onClick={terapkan} loading={loading && Boolean(data)}>
              Terapkan
            </Button>
            {(adaFilter || form.tanggal_mulai || form.tanggal_selesai) && (
              <Button variant="outline" onClick={reset}>
                Reset
              </Button>
            )}
          </div>
        }
      />

      {error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : (
        <>
          {/* ===== KPI ===== */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              loading={loading}
              title="Jumlah Baris Data"
              value={formatNumber(ringkasan?.jumlah_baris)}
              icon={<Database className="h-5 w-5" />}
              badge={
                ringkasan && (
                  <Badge tone={ringkasan.memenuhi_min_baris ? 'green' : 'amber'}>
                    {ringkasan.memenuhi_min_baris ? 'Cukup' : 'Kurang'}
                  </Badge>
                )
              }
              subtitle={`Minimal analisis ${formatNumber(ringkasan?.min_baris_analisis)} baris`}
            />
            <KpiCard
              loading={loading}
              title="Rentang Data"
              value={`${formatNumber(ringkasan?.rentang_hari)} hari`}
              icon={<CalendarRange className="h-5 w-5" />}
              subtitle={`${formatTanggal(ringkasan?.tanggal_awal)} – ${formatTanggal(ringkasan?.tanggal_akhir)}`}
            />
            <KpiCard
              loading={loading}
              title="Rute & Pelanggan"
              value={`${formatNumber(ringkasan?.jumlah_rute)} rute`}
              icon={<RouteIcon className="h-5 w-5" />}
              subtitle={`${formatNumber(ringkasan?.jumlah_pelanggan)} pelanggan · ${formatNumber(ringkasan?.jumlah_cabang)} cabang asal`}
            />
            <KpiCard
              loading={loading}
              title="Total Penumpang"
              value={formatCompact(ringkasan?.total_penumpang)}
              icon={<Users className="h-5 w-5" />}
              subtitle={`Pendapatan ${formatCurrency(ringkasan?.total_pendapatan, { compact: true })}`}
            />
          </div>

          {!loading && ringkasan?.jumlah_baris === 0 ? (
            <Card className="mt-4">
              <p className="py-10 text-center text-sm text-slate-400">Tidak ada transaksi pada rentang yang dipilih.</p>
            </Card>
          ) : (
            <>
              {/* ===== TREN BULANAN ===== */}
              <Card
                className="mt-4"
                title="Tren Bulanan"
                subtitle="Jumlah penumpang (batang) dan pendapatan (garis) per bulan"
                icon={<Wallet className="h-5 w-5" />}
              >
                {loading ? (
                  <CenterSpinner />
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data?.tren_bulanan ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} interval="preserveStartEnd" minTickGap={12} />
                        <YAxis yAxisId="pax" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v: number) => formatCompact(v)} width={52} />
                        <YAxis yAxisId="rp" orientation="right" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v: number) => formatCompact(v)} width={56} />
                        <Tooltip
                          formatter={(v: number, nama: string) =>
                            nama === 'Pendapatan' ? [formatCurrency(v), nama] : [formatNumber(v), nama]
                          }
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar yAxisId="pax" dataKey="penumpang" name="Penumpang" fill={BRAND.maroon} radius={[3, 3, 0, 0]} maxBarSize={22} />
                        <Line yAxisId="rp" type="monotone" dataKey="pendapatan" name="Pendapatan" stroke={BRAND.amber} strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* ===== POLA HARI + EFEK KALENDER ===== */}
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card title="Pola Hari dalam Seminggu" subtitle="Rata-rata penumpang per hari (termasuk hari tanpa transaksi)">
                  {loading ? (
                    <CenterSpinner />
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.pola_hari ?? []} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis dataKey="hari" tick={{ fontSize: 12, fill: '#64748B' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v: number) => formatCompact(v)} />
                          <Tooltip formatter={(v: number) => [formatNumber(Math.round(v)), 'Rata-rata penumpang/hari']} />
                          <Bar dataKey="rata_penumpang" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {(data?.pola_hari ?? []).map((h) => (
                              <Cell key={h.hari} fill={h.urutan >= 5 ? BRAND.amber : BRAND.maroon} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <Card
                  title="Efek Kalender"
                  subtitle="Rata-rata penumpang harian: akhir pekan & hari libur vs hari biasa"
                >
                  {loading ? (
                    <CenterSpinner />
                  ) : (
                    <div className="space-y-5">
                      {(data?.efek_kalender ?? []).map((e) => (
                        <EfekKalenderRow key={e.faktor} efek={e} />
                      ))}
                      {(data?.hari_tanpa_kalender ?? 0) > 0 && (
                        <p className="text-xs text-amber-700">
                          {formatNumber(data?.hari_tanpa_kalender)} hari tidak ada di tabel kalender dan dianggap hari biasa.
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* ===== DISTRIBUSI KATEGORI ===== */}
              <Card className="mt-4" title="Distribusi Kategori" subtitle="Komposisi transaksi per kategori" noPadding>
                <div className="flex flex-wrap gap-1.5 border-b border-hairline px-5 py-3">
                  {TAB_DISTRIBUSI.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTabDistribusi(t.key)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        tabDistribusi === t.key ? 'bg-maroon-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {loading ? (
                  <CenterSpinner />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-5">
                    <div className="p-5 lg:col-span-2">
                      <div style={{ height: Math.max(160, distribusi.length * 44) }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={distribusi} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="kategori" width={120} tick={{ fontSize: 11, fill: '#475569' }} />
                            <Tooltip formatter={(v: number) => [formatNumber(v), 'Transaksi']} />
                            <Bar dataKey="transaksi" radius={[0, 4, 4, 0]} maxBarSize={26}>
                              {distribusi.map((d, i) => (
                                <Cell key={d.kategori} fill={WARNA_DISTRIBUSI[i % WARNA_DISTRIBUSI.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="border-t border-hairline lg:col-span-3 lg:border-l lg:border-t-0">
                      <Table columns={kolomDistribusi} data={distribusi} keyField={(d) => d.kategori} />
                    </div>
                  </div>
                )}
              </Card>

              {/* ===== STATISTIK DESKRIPTIF + KELENGKAPAN ===== */}
              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
                <Card
                  className="xl:col-span-3"
                  title="Statistik Deskriptif"
                  subtitle="Transaksi penumpang: count, mean, std, min, kuartil, max"
                  noPadding
                >
                  <Table columns={kolomStatistik} data={data?.statistik ?? []} keyField={(s) => s.variabel} loading={loading} skeletonRows={3} />
                </Card>
                <Card
                  className="xl:col-span-2"
                  title="Kelengkapan Data"
                  subtitle="Jumlah nilai kosong per kolom penting"
                  noPadding
                >
                  <Table columns={kolomKelengkapan} data={data?.kelengkapan ?? []} keyField={(k) => k.kolom} loading={loading} />
                  <p className="px-5 py-3 text-xs text-slate-500">
                    id_member & nama_pelanggan memang kosong untuk transaksi Paket (pengiriman barang).
                  </p>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function EfekKalenderRow({ efek }: { efek: EdaEfekKalender }) {
  const ya = efek.rata_penumpang_ya ?? 0;
  const tidak = efek.rata_penumpang_tidak ?? 0;
  const maks = Math.max(ya, tidak, 1);
  const naik = (efek.selisih_persen ?? 0) >= 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{efek.nama}</span>
        {efek.selisih_persen !== null ? (
          <Badge tone={naik ? 'green' : 'red'}>{formatDelta(efek.selisih_persen)}</Badge>
        ) : (
          <Badge tone="slate">Tidak ada hari</Badge>
        )}
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-28 shrink-0 text-slate-500">{efek.label_ya}</span>
          <ProgressBar value={(ya / maks) * 100} color="amber" height="sm" className="flex-1" />
          <span className="w-24 shrink-0 text-right font-semibold tabular-nums text-slate-700">
            {efek.rata_penumpang_ya === null ? '—' : formatNumber(Math.round(ya))}
            <span className="font-normal text-slate-400"> ({formatNumber(efek.jumlah_hari_ya)} hr)</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-28 shrink-0 text-slate-500">{efek.label_tidak}</span>
          <ProgressBar value={(tidak / maks) * 100} color="maroon" height="sm" className="flex-1" />
          <span className="w-24 shrink-0 text-right font-semibold tabular-nums text-slate-700">
            {efek.rata_penumpang_tidak === null ? '—' : formatNumber(Math.round(tidak))}
            <span className="font-normal text-slate-400"> ({formatNumber(efek.jumlah_hari_tidak)} hr)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
