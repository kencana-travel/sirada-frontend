import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, Layers, Play } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge, { memberTone, type BadgeTone } from '../components/Badge';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import ProgressBar from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getCluster, getRingkasan } from '../api/segmentasi';
import { getErrorMessage } from '../api/client';
import { classNames, formatCurrency, formatNumber, formatPercent, initials } from '../lib/format';
import { BRAND, segmentColor } from '../lib/colors';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Pelanggan } from '../types';
import type { EvaluasiPerK, HasilSegmentasi } from '../types/segmentasi';

const PILIHAN_K = [2, 3, 4, 5, 6, 7, 8];

/** Warna badge per nama segmen hasil clustering (label dari backend). */
function segmenTone(label: string): BadgeTone {
  const v = label.toLowerCase();
  if (v.includes('utama')) return 'purple';
  if (v.includes('loyal')) return 'gold';
  if (v.includes('potensial')) return 'blue';
  if (v.includes('reguler')) return 'green';
  if (v.includes('perhatian')) return 'amber';
  if (v.includes('berisiko') || v.includes('jarang')) return 'red';
  return 'slate';
}

const formatDesimal = (v: number | null | undefined, digit = 3) =>
  v === null || v === undefined ? '—' : v.toFixed(digit).replace('.', ',');

export default function Segmentasi() {
  const { canWrite } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('Semua');
  const [pilihanK, setPilihanK] = useState<string>('otomatis');
  const [hasil, setHasil] = useState<HasilSegmentasi | null>(null);
  const [clustering, setClustering] = useState(false);

  const { data, loading, error, reload } = useAsync(getRingkasan, []);

  const pelanggan = hasil?.pelanggan ?? [];
  const evaluasi = hasil?.evaluasi;

  const totalDistribusi = useMemo(
    () => (data?.distribusi ?? []).reduce((s, d) => s + d.jumlah, 0),
    [data?.distribusi],
  );

  const tabs = useMemo(
    () => ['Semua', ...(hasil?.ringkasan_cluster ?? []).map((c) => c.label)],
    [hasil?.ringkasan_cluster],
  );

  const filteredPelanggan = useMemo(
    () => (tab === 'Semua' ? pelanggan : pelanggan.filter((p) => p.status_loyalitas === tab)),
    [pelanggan, tab],
  );

  const runCluster = async () => {
    setClustering(true);
    try {
      const result = await getCluster(pilihanK === 'otomatis' ? null : Number(pilihanK));
      setHasil(result);
      setTab('Semua');
      if (result.pesan) {
        toast.info(result.pesan);
      } else {
        toast.success(
          `Segmentasi selesai — ${formatNumber(result.jumlah_pelanggan)} pelanggan dibagi ke ${result.evaluasi.k_terpilih} cluster.`,
        );
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menjalankan segmentasi pelanggan.'));
    } finally {
      setClustering(false);
    }
  };

  const columns: Column<Pelanggan>[] = [
    {
      key: 'nama',
      header: 'Nama Pelanggan',
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-maroon-100 text-xs font-bold text-maroon-700">
            {initials(p.nama)}
          </span>
          <div className="font-semibold text-slate-800">{p.nama}</div>
        </div>
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
            <div className="text-xs text-slate-400">rata-rata {formatCurrency(p.rata_rata_belanja, { compact: true })}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status_loyalitas',
      header: 'Segmen',
      align: 'center',
      render: (p) =>
        p.status_loyalitas ? (
          <Badge tone={segmenTone(String(p.status_loyalitas))}>{p.status_loyalitas}</Badge>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
  ];

  const kolomEvaluasi: Column<EvaluasiPerK>[] = [
    {
      key: 'k',
      header: 'K',
      render: (r) => (
        <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
          {r.k}
          {r.k === evaluasi?.k_terpilih && <Badge tone="maroon">Terpilih</Badge>}
        </span>
      ),
    },
    { key: 'inertia', header: 'Inertia', align: 'right', render: (r) => <span className="tabular-nums">{formatDesimal(r.inertia, 3)}</span> },
    {
      key: 'silhouette',
      header: 'Silhouette',
      align: 'right',
      render: (r) => (
        <span
          className={classNames(
            'tabular-nums',
            r.silhouette !== null && r.silhouette >= (evaluasi?.silhouette_min_valid ?? 0.5)
              ? 'font-semibold text-green-700'
              : 'text-slate-700',
          )}
        >
          {formatDesimal(r.silhouette)}
        </span>
      ),
    },
    { key: 'dbi', header: 'DBI', align: 'right', render: (r) => <span className="tabular-nums">{formatDesimal(r.dbi)}</span> },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb={['Pelanggan & Audiens', 'Segmentasi Pasar']}
        title="Segmentasi Pasar & Analisis Pelanggan"
        subtitle="Komposisi jenis member dan segmentasi pelanggan dengan RFM + K-Means."
      />

      {error ? (
        <Card>
          <ErrorState message={error} onRetry={reload} />
        </Card>
      ) : (
        <>
          {/* ===== 3 KARTU JENIS MEMBER ===== */}
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
                    <div key={seg.jenis_member} className="rounded-xl border border-hairline bg-white p-5 shadow-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segmentColor(seg.jenis_member, i) }} />
                          <h3 className="font-bold text-slate-900">{seg.jenis_member}</h3>
                        </div>
                        <Badge tone={memberTone(seg.jenis_member)}>{formatPercent(seg.share_persen, 0)} share</Badge>
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
                          <dt className="text-slate-500">Rata-rata / Transaksi</dt>
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

          {/* ===== DISTRIBUSI + KONTROL SEGMENTASI ===== */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Distribusi Jenis Keanggotaan" subtitle="Proporsi transaksi penumpang per jenis member">
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
              title="Segmentasi Pelanggan (RFM + K-Means)"
              subtitle="Recency, Frequency, Monetary per pelanggan → transformasi log + Min-Max → K-Means"
              icon={<Layers className="h-5 w-5" />}
            >
              <ol className="space-y-2 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-slate-800">1. RFM</span> — Recency (hari sejak transaksi terakhir),
                  Frequency (jumlah transaksi), Monetary (total belanja) dari transaksi penumpang.
                </li>
                <li>
                  <span className="font-semibold text-slate-800">2. Log + Min-Max</span> — ketiga fitur ditransformasi log(1 + x) untuk meredam pencilan, lalu diskalakan ke rentang 0–1.
                </li>
                <li>
                  <span className="font-semibold text-slate-800">3. K-Means K = 2–8</span> — dievaluasi dengan Elbow (inertia),
                  Silhouette, dan Davies-Bouldin Index (DBI).
                </li>
                <li>
                  <span className="font-semibold text-slate-800">4. Label segmen</span> — cluster diurutkan dari skor
                  (1 − R) + F + M pada centroid; label bersifat relatif antar-cluster.
                </li>
              </ol>

              {canWrite ? (
                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-hairline pt-4">
                  <label className="text-xs font-semibold text-slate-500">
                    Jumlah cluster (K)
                    <select
                      value={pilihanK}
                      onChange={(e) => setPilihanK(e.target.value)}
                      disabled={clustering}
                      className="mt-1 block h-10 w-44 rounded-lg border border-hairline bg-white px-3 text-sm font-medium text-slate-700 focus:border-maroon-600 focus:outline-none"
                    >
                      <option value="otomatis">Otomatis (Silhouette)</option>
                      {PILIHAN_K.map((k) => (
                        <option key={k} value={k}>
                          K = {k}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button leftIcon={<Play className="h-4 w-4" />} loading={clustering} onClick={runCluster}>
                    {clustering ? 'Menghitung…' : 'Jalankan Segmentasi'}
                  </Button>
                  {clustering && (
                    <span className="text-xs text-slate-400">Proses awal bisa memakan waktu hingga 1 menit.</span>
                  )}
                </div>
              ) : (
                <p className="mt-5 border-t border-hairline pt-4 text-sm text-slate-400">
                  Segmentasi pelanggan hanya dapat dijalankan oleh Admin.
                </p>
              )}
            </Card>
          </div>

          {/* ===== EVALUASI K ===== */}
          {evaluasi && evaluasi.per_k.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
              <Card
                className="lg:col-span-3"
                title="Metode Elbow"
                subtitle="Inertia (jumlah kuadrat jarak ke centroid) untuk tiap K"
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evaluasi.per_k} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="k" tick={{ fontSize: 12, fill: '#64748B' }} label={{ value: 'K', position: 'insideBottomRight', offset: -2, fontSize: 12, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748B' }} width={48} tickFormatter={(v: number) => v.toFixed(1).replace('.', ',')} />
                      <Tooltip
                        formatter={(v: number) => [formatDesimal(v, 3), 'Inertia']}
                        labelFormatter={(k) => `K = ${k}`}
                      />
                      {evaluasi.k_terpilih && (
                        <ReferenceLine
                          x={evaluasi.k_terpilih}
                          stroke={BRAND.amber}
                          strokeDasharray="4 4"
                          label={{ value: `K terpilih = ${evaluasi.k_terpilih}`, position: 'top', fontSize: 11, fill: '#B45309' }}
                        />
                      )}
                      <Line type="monotone" dataKey="inertia" stroke={BRAND.maroon} strokeWidth={2.5} dot={{ r: 4, fill: BRAND.maroon }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card
                className="lg:col-span-2"
                title="Silhouette & Davies-Bouldin"
                subtitle={`Silhouette makin tinggi makin baik; DBI makin rendah makin baik`}
                action={
                  <Badge tone={evaluasi.valid ? 'green' : 'amber'} dot>
                    {evaluasi.valid ? 'Valid' : 'Belum valid'}
                  </Badge>
                }
                noPadding
              >
                <div className="grid grid-cols-3 gap-3 border-b border-hairline px-5 py-4 text-center">
                  <div>
                    <div className="text-2xl font-extrabold tabular-nums text-slate-900">{evaluasi.k_terpilih ?? '—'}</div>
                    <div className="text-[11px] text-slate-400">K {evaluasi.mode === 'manual' ? '(manual)' : '(otomatis)'}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold tabular-nums text-slate-900">{formatDesimal(evaluasi.silhouette)}</div>
                    <div className="text-[11px] text-slate-400">Silhouette</div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold tabular-nums text-slate-900">{formatDesimal(evaluasi.dbi)}</div>
                    <div className="text-[11px] text-slate-400">DBI</div>
                  </div>
                </div>
                <Table columns={kolomEvaluasi} data={evaluasi.per_k} keyField={(r) => r.k} />
                <p className="px-5 py-3 text-xs text-slate-500">
                  Hasil dianggap valid bila Silhouette ≥ {formatDesimal(evaluasi.silhouette_min_valid ?? 0.5, 1)}.
                  {!evaluasi.valid &&
                    ' Struktur cluster pada data ini masih lemah, sehingga segmen sebaiknya dibaca sebagai pengelompokan relatif.'}
                </p>
              </Card>
            </div>
          )}

          {/* ===== PROFIL CLUSTER ===== */}
          {hasil && hasil.ringkasan_cluster.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {hasil.ringkasan_cluster.map((c) => (
                <div key={c.cluster} className="rounded-xl border border-hairline bg-white p-5 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={segmenTone(c.label)} size="md">{c.label}</Badge>
                    <span className="text-xs text-slate-400">Cluster {c.cluster}</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tabular-nums text-slate-900">{formatNumber(c.jumlah_pelanggan)}</span>
                    <span className="text-sm text-slate-400">pelanggan</span>
                    {c.persen_pelanggan !== undefined && (
                      <span className="ml-auto text-xs font-semibold text-slate-500">{formatPercent(c.persen_pelanggan, 1)}</span>
                    )}
                  </div>
                  <dl className="mt-3 space-y-2 border-t border-hairline pt-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Rata-rata Recency</dt>
                      <dd className="font-semibold tabular-nums text-slate-800">{c.rata_recency_hari.toString().replace('.', ',')} hari</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Rata-rata Frequency</dt>
                      <dd className="font-semibold tabular-nums text-slate-800">{formatNumber(c.rata_frequency)} trx</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Rata-rata Monetary</dt>
                      <dd className="font-semibold tabular-nums text-slate-800">{formatCurrency(c.rata_monetary, { compact: true })}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}

          {/* ===== TABEL PELANGGAN ===== */}
          <Card
            className="mt-4"
            title="Daftar Pelanggan per Segmen"
            subtitle={
              hasil
                ? `${formatNumber(pelanggan.length)} pelanggan, diurutkan dari total belanja tertinggi`
                : 'Tersedia setelah segmentasi dijalankan'
            }
            noPadding
          >
            {tabs.length > 1 && (
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
            )}
            <Table
              columns={columns}
              data={filteredPelanggan}
              keyField={(p) => p.id}
              loading={clustering}
              emptyMessage={
                canWrite
                  ? 'Klik "Jalankan Segmentasi" untuk mengelompokkan pelanggan.'
                  : 'Daftar pelanggan tersedia setelah Admin menjalankan segmentasi.'
              }
            />
          </Card>
        </>
      )}
    </div>
  );
}
