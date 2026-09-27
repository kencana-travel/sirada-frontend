import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bus,
  Clock,
  Repeat,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge, { loyalitasTone, memberTone } from '../components/Badge';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import ProgressBar from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getCluster, getRingkasan } from '../api/segmentasi';
import { getErrorMessage } from '../api/client';
import { formatCurrency, formatNumber, formatPercent, initials } from '../lib/format';
import { segmentColor } from '../lib/colors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Pelanggan } from '../types';

export default function Segmentasi() {
  const { canWrite } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('Semua');
  const [clusterPelanggan, setClusterPelanggan] = useState<Pelanggan[] | null>(null);
  const [clustering, setClustering] = useState(false);

  const { data, loading, error, reload } = useAsync(getRingkasan, []);

  // Daftar pelanggan + status loyalitas hanya tersedia dari hasil model clustering.
  const pelanggan = clusterPelanggan ?? data?.pelanggan ?? [];

  const totalDistribusi = useMemo(
    () => (data?.distribusi ?? []).reduce((s, d) => s + d.jumlah, 0),
    [data?.distribusi],
  );

  const tabs = useMemo(() => {
    const tier = Array.from(
      new Set(pelanggan.map((p) => p.status_loyalitas).filter((s): s is string => Boolean(s))),
    );
    return ['Semua', ...tier];
  }, [pelanggan]);

  const filteredPelanggan = useMemo(
    () => (tab === 'Semua' ? pelanggan : pelanggan.filter((p) => p.status_loyalitas === tab)),
    [pelanggan, tab],
  );

  const runCluster = async () => {
    setClustering(true);
    try {
      const result = await getCluster();
      setClusterPelanggan(result.pelanggan);
      setTab('Semua');
      toast.success(`Model AI selesai — ${result.pelanggan.length} pelanggan diklasterisasi.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menjalankan model clustering.'));
    } finally {
      setClustering(false);
    }
  };

  const wawasan = data?.wawasan;
  const perbandingan =
    wawasan?.perbandingan ??
    (wawasan
      ? [
          { label: 'VIP Preferensi', persen: wawasan.vip_preferensi_persen ?? 0 },
          { label: 'Reguler', persen: wawasan.reguler_preferensi_persen ?? 0 },
        ]
      : []);

  const columns: Column<Pelanggan>[] = [
    {
      key: 'nama',
      header: 'ID & Nama Pelanggan',
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-maroon-100 text-xs font-bold text-maroon-700">
            {initials(p.nama)}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800">{p.nama}</div>
            {p.email && <div className="truncate text-xs text-slate-400">{p.email}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'jenis_member',
      header: 'Jenis Member',
      render: (p) =>
        p.jenis_member ? (
          <Badge tone={memberTone(p.jenis_member)}>{p.jenis_member}</Badge>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
    {
      key: 'total_transaksi',
      header: 'Total Transaksi',
      align: 'right',
      render: (p) => <span className="font-semibold tabular-nums">{formatNumber(p.total_transaksi)}</span>,
    },
    {
      key: 'total_belanja',
      header: 'Total Belanja',
      align: 'right',
      render: (p) => (
        <div className="text-right">
          <div className="font-semibold tabular-nums text-slate-900">{formatCurrency(p.total_belanja, { compact: true })}</div>
          {p.rata_rata_belanja !== undefined && (
            <div className="text-xs text-slate-400">avg {formatCurrency(p.rata_rata_belanja, { compact: true })}</div>
          )}
        </div>
      ),
    },
    { key: 'rute_favorit', header: 'Rute Favorit', render: (p) => <span className="text-slate-600">{p.rute_favorit ?? '—'}</span> },
    {
      key: 'status_loyalitas',
      header: 'Status Loyalitas',
      align: 'center',
      render: (p) =>
        p.status_loyalitas ? (
          <Badge tone={loyalitasTone(String(p.status_loyalitas))}>{p.status_loyalitas}</Badge>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
  ];

  // Backend belum mengirim jenis member & rute favorit per pelanggan — sembunyikan kolom yang kosong.
  const visibleColumns = columns.filter((c) => {
    if (c.key === 'jenis_member') return pelanggan.some((p) => p.jenis_member);
    if (c.key === 'rute_favorit') return pelanggan.some((p) => p.rute_favorit);
    return true;
  });

  return (
    <div>
      <PageHeader
        breadcrumb={['Pelanggan & Audiens', 'Segmentasi Pasar']}
        title="Segmentasi Pasar & Analisis Pelanggan"
        subtitle="Pahami komposisi, nilai, dan perilaku tiap segmen pelanggan."
      />

      {error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : (
        <>
          {/* ===== 3 KARTU SEGMEN ===== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CenterSpinner />
                  </Card>
                ))
              : (data?.segmen ?? []).map((seg, i) => {
                  const up = (seg.total_transaksi_tren_persen ?? 0) >= 0;
                  return (
                    <div
                      key={seg.jenis_member}
                      className="rounded-xl border border-hairline bg-white p-5 shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segmentColor(seg.jenis_member, i) }} />
                          <h3 className="font-bold text-slate-900">{seg.jenis_member}</h3>
                        </div>
                        <Badge tone="maroon">{formatPercent(seg.share_persen, 0)} share</Badge>
                      </div>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold tabular-nums text-slate-900">
                          {formatNumber(seg.total_transaksi)}
                        </span>
                        <span className="text-sm text-slate-400">transaksi</span>
                        {seg.total_transaksi_tren_persen !== undefined && (
                          <span
                            className={`ml-auto inline-flex items-center gap-0.5 text-xs font-semibold ${
                              up ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {formatPercent(Math.abs(seg.total_transaksi_tren_persen), 1)}
                          </span>
                        )}
                      </div>

                      <dl className="mt-4 space-y-2.5 border-t border-hairline pt-4 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Total Pendapatan</dt>
                          <dd className="font-semibold tabular-nums text-slate-800">{formatCurrency(seg.total_pendapatan, { compact: true })}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Rata-rata / Tiket</dt>
                          <dd className="font-semibold tabular-nums text-slate-800">{formatCurrency(seg.rata_rata_transaksi)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Rute Favorit</dt>
                          <dd className="font-medium text-slate-800">{seg.rute_favorit}</dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
          </div>

          {/* ===== DISTRIBUSI + WAWASAN ===== */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Distribusi Jenis Keanggotaan" subtitle="Proporsi pelanggan per segmen">
              {loading ? (
                <CenterSpinner />
              ) : (
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="relative h-44 w-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data?.distribusi ?? []} dataKey="jumlah" nameKey="segmen" innerRadius={52} outerRadius={76} paddingAngle={2} stroke="none">
                          {(data?.distribusi ?? []).map((d, i) => (
                            <Cell key={d.segmen} fill={segmentColor(d.segmen, i)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatNumber(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold tabular-nums text-slate-900">{formatNumber(totalDistribusi)}</span>
                      <span className="text-[11px] text-slate-400">Transaksi</span>
                    </div>
                  </div>
                  <ul className="w-full flex-1 space-y-3">
                    {(data?.distribusi ?? []).map((d, i) => {
                      const pct = d.persen ?? (totalDistribusi ? (d.jumlah / totalDistribusi) * 100 : 0);
                      return (
                        <li key={d.segmen}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-slate-600">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segmentColor(d.segmen, i) }} />
                              {d.segmen}
                            </span>
                            <span className="font-semibold tabular-nums text-slate-800">{formatPercent(pct, 0)}</span>
                          </div>
                          <ProgressBar value={pct} color="maroon" height="sm" />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>

            <Card
              title="Wawasan Perilaku Pelanggan"
              subtitle="Pola pemesanan & preferensi"
              action={<Badge tone="purple" dot>Machine Intel</Badge>}
            >
              {loading ? (
                <CenterSpinner />
              ) : !wawasan ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Data wawasan perilaku belum tersedia dari server.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniStat icon={<Repeat className="h-4 w-4" />} label="Repeat Order" value={formatPercent(wawasan?.repeat_order_rate_persen ?? 0, 0)} />
                    <MiniStat icon={<Clock className="h-4 w-4" />} label="Jam Puncak" value={wawasan?.jam_pemesanan_puncak ?? '—'} />
                    <MiniStat icon={<Bus className="h-4 w-4" />} label="Preferensi" value={wawasan?.preferensi_armada ?? '—'} />
                  </div>
                  <div className="mt-5 space-y-3.5">
                    {perbandingan.map((c) => (
                      <div key={c.label}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-slate-600">{c.label}</span>
                          <span className="font-semibold tabular-nums text-slate-800">{formatPercent(c.persen, 0)}</span>
                        </div>
                        <ProgressBar value={c.persen} color={c.label.toLowerCase().includes('vip') ? 'maroon' : 'blue'} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* ===== TABEL PELANGGAN ===== */}
          <Card
            className="mt-4"
            title="Semua Pelanggan"
            subtitle="Daftar lengkap dengan status loyalitas"
            action={
              canWrite ? (
                <Button
                  size="sm"
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  loading={clustering}
                  onClick={runCluster}
                >
                  Jalankan Model AI
                </Button>
              ) : (
                <Badge tone="slate">Read-only</Badge>
              )
            }
            noPadding
          >
            {/* Tab filter */}
            <div className="flex flex-wrap gap-1.5 border-b border-hairline px-5 py-3">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    tab === t ? 'bg-maroon-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Table
              columns={visibleColumns}
              data={filteredPelanggan}
              keyField={(p) => p.id}
              loading={loading || clustering}
              emptyMessage={
                canWrite
                  ? 'Klik "Jalankan Model AI" untuk menghitung status loyalitas pelanggan.'
                  : 'Daftar pelanggan tersedia setelah Admin menjalankan model AI.'
              }
            />
          </Card>
        </>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-slate-50/60 p-3 text-center">
      <span className="mx-auto grid h-8 w-8 place-items-center rounded-lg bg-white text-maroon-700 shadow-sm">
        {icon}
      </span>
      <div className="mt-2 text-sm font-bold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  );
}
