import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  BusFront,
  Gauge,
  Lightbulb,
  Lock,
  Play,
  Target,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import ProgressBar, { loadFactorColor } from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getRuteTersedia, runForecast } from '../api/forecasting';
import { getErrorMessage } from '../api/client';
import { formatNumber, formatPercent } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { ForecastDeretPoint, ForecastRunResponse, MatriksMuatanRute } from '../types';

const HORIZON = [7, 14, 30];
const VIEWS = [
  { value: 'harian', label: 'Harian' },
  { value: 'mingguan', label: 'Mingguan' },
  { value: 'bulanan', label: 'Bulanan' },
] as const;

type ViewMode = (typeof VIEWS)[number]['value'];

function aggregate(deret: ForecastDeretPoint[], view: ViewMode): ForecastDeretPoint[] {
  if (view === 'harian' || deret.length === 0) return deret;
  const size = view === 'mingguan' ? 7 : 30;
  const out: ForecastDeretPoint[] = [];
  for (let i = 0; i < deret.length; i += size) {
    const chunk = deret.slice(i, i + size);
    const sum = (k: 'aktual' | 'prediksi') =>
      chunk.reduce((s, p) => s + (p[k] ?? 0), 0);
    out.push({
      tanggal: chunk.length > 1 ? `${chunk[0].tanggal}…${chunk[chunk.length - 1].tanggal}` : chunk[0].tanggal,
      aktual: chunk.some((p) => p.aktual != null) ? sum('aktual') : null,
      prediksi: chunk.some((p) => p.prediksi != null) ? sum('prediksi') : null,
    });
  }
  return out;
}

export default function Forecasting() {
  const { canWrite } = useAuth();
  const toast = useToast();

  const [rute, setRute] = useState('');
  const [horizon, setHorizon] = useState(7);
  const [libur, setLibur] = useState(false);
  const [view, setView] = useState<ViewMode>('harian');
  const [result, setResult] = useState<ForecastRunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ranOnce = useRef(false);

  const ruteOptions = useAsync(getRuteTersedia, []);

  useEffect(() => {
    if (!rute && ruteOptions.data?.length) setRute(ruteOptions.data[0]);
  }, [ruteOptions.data, rute]);

  const run = useCallback(
    async (r: string, h: number, l: boolean) => {
      if (!r) return;
      setRunning(true);
      setError(null);
      try {
        const res = await runForecast({ rute: r, horizon_hari: h, libur_akhir_pekan: l });
        setResult(res);
        toast.success('Model AI selesai dijalankan.');
      } catch (err) {
        const msg = getErrorMessage(err, 'Gagal menjalankan model forecasting.');
        setError(msg);
        toast.error(msg);
      } finally {
        setRunning(false);
      }
    },
    [toast],
  );

  // Auto-run sekali saat rute default tersedia (agar halaman tidak kosong).
  // Hanya untuk Admin: POST /forecasting/run dibatasi role Admin (non-Admin dapat 403).
  useEffect(() => {
    if (canWrite && rute && !ranOnce.current) {
      ranOnce.current = true;
      run(rute, horizon, libur);
    }
  }, [canWrite, rute, horizon, libur, run]);

  const chartData = useMemo(() => aggregate(result?.deret ?? [], view), [result?.deret, view]);

  const peak = useMemo(() => {
    if (view !== 'harian' || chartData.length === 0) return null;
    let best: { tanggal: string; value: number } | null = null;
    for (const p of chartData) {
      const v = p.prediksi ?? p.aktual ?? 0;
      if (!best || v > best.value) best = { tanggal: p.tanggal, value: v };
    }
    return best;
  }, [chartData, view]);

  const up = (result?.prediksi_tren_persen ?? 0) >= 0;

  const matriksColumns: Column<MatriksMuatanRute>[] = [
    { key: 'rute', header: 'Rute', render: (r) => <span className="font-semibold text-slate-800">{r.rute}</span> },
    { key: 'kapasitas_tersedia', header: 'Kapasitas', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.kapasitas_tersedia)}</span> },
    { key: 'prediksi_penumpang', header: 'Prediksi Penumpang', align: 'right', render: (r) => <span className="font-semibold tabular-nums">{formatNumber(r.prediksi_penumpang)}</span> },
    {
      key: 'load_factor',
      header: 'Estimasi Load Factor',
      render: (r) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={r.load_factor_persen} color={loadFactorColor(r.load_factor_persen)} height="sm" className="min-w-[80px]" />
          <span className="w-12 text-right text-xs font-semibold tabular-nums text-slate-700">{formatPercent(r.load_factor_persen, 0)}</span>
        </div>
      ),
    },
    {
      key: 'rekomendasi_armada',
      header: 'Rekomendasi Armada',
      render: (r) => <Badge tone={r.load_factor_persen >= 85 ? 'red' : r.load_factor_persen >= 70 ? 'amber' : 'blue'}>{r.rekomendasi_armada}</Badge>,
    },
  ];

  const selectClass =
    'h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-slate-700 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

  return (
    <div>
      <PageHeader
        badge={{ label: 'Predictive Intelligence Engine', tone: 'purple', dot: true }}
        title="Forecasting Demand & Prediksi Muatan Armada"
        subtitle="Proyeksikan permintaan penumpang dan optimalkan alokasi armada per koridor."
        actions={
          <Badge tone="green" dot>
            Model Status: Real-time Calibrated
          </Badge>
        }
      />

      {/* ===== PANEL KONTROL ===== */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Koridor Perjalanan</label>
            <select value={rute} onChange={(e) => setRute(e.target.value)} disabled={!canWrite} className={selectClass}>
              {ruteOptions.loading && <option>Memuat rute...</option>}
              {(ruteOptions.data ?? []).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Horizon Waktu Prediksi</label>
            <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} disabled={!canWrite} className={selectClass}>
              {HORIZON.map((h) => (
                <option key={h} value={h}>
                  {h} Hari
                </option>
              ))}
            </select>
          </div>
          <label className="flex h-10 items-center gap-2.5 rounded-lg border border-hairline px-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={libur}
              onChange={(e) => setLibur(e.target.checked)}
              disabled={!canWrite}
              className="h-4 w-4 rounded border-slate-300 text-maroon-700 focus:ring-maroon-500 disabled:opacity-50"
            />
            Libur Panjang &amp; Akhir Pekan
          </label>
          {canWrite ? (
            <Button leftIcon={<Play className="h-4 w-4" />} loading={running} onClick={() => run(rute, horizon, libur)}>
              Jalankan Model AI
            </Button>
          ) : (
            <div className="text-xs text-slate-400">
              Mode <span className="font-semibold text-slate-500">read-only</span> — parameter dikunci.
            </div>
          )}
        </div>
      </Card>

      {error && !result ? (
        <Card>
          <ErrorState message={error} onRetry={() => run(rute, horizon, libur)} />
        </Card>
      ) : running && !result ? (
        <Card>
          <CenterSpinner label="Menjalankan model prediksi..." />
        </Card>
      ) : result ? (
        <>
          {/* ===== 3 KARTU HASIL ===== */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Prediksi Demand Periode Berikutnya</p>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-maroon-50 text-maroon-700"><TrendingUp className="h-5 w-5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-slate-900">{formatNumber(result.prediksi_periode_berikutnya)}</span>
                <span className="text-sm text-slate-400">pax</span>
              </div>
              {result.prediksi_tren_persen !== undefined && (
                <span className={`mt-2 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {formatPercent(Math.abs(result.prediksi_tren_persen), 1)} vs periode lalu
                </span>
              )}
            </Card>

            <Card>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Tingkat Akurasi Model AI</p>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-green-50 text-green-600"><Target className="h-5 w-5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-slate-900">{formatPercent(result.akurasi_persen, 1)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                MAPE <span className="font-semibold text-slate-600">{formatPercent(result.mape_persen, 2)}</span>
                {result.mae !== undefined && (
                  <> · MAE <span className="font-semibold text-slate-600">{formatNumber(result.mae)}</span></>
                )}
                {result.rmse !== undefined && (
                  <> · RMSE <span className="font-semibold text-slate-600">{formatNumber(result.rmse)}</span></>
                )}
              </p>
              {result.model && (
                <p className="mt-1 text-xs text-slate-400">
                  Model <span className="font-semibold text-slate-600">{result.model}</span>
                </p>
              )}
            </Card>

            <Card>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Rekomendasi Penambahan Unit</p>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-600"><BusFront className="h-5 w-5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-slate-900">+{formatNumber(result.rekomendasi_unit_tambahan)}</span>
                <span className="text-sm text-slate-400">unit</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{result.catatan_jadwal ?? 'Fokuskan pada jadwal keberangkatan puncak.'}</p>
            </Card>
          </div>

          {/* ===== CHART BESAR ===== */}
          <Card
            className="mt-4"
            title="Proyeksi Demand: Aktual vs Prediksi"
            subtitle={`Koridor ${rute || '—'} · horizon ${horizon} hari`}
            action={
              <div className="flex rounded-lg border border-hairline bg-white p-0.5">
                {VIEWS.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setView(v.value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      view === v.value ? 'bg-maroon-700 text-white' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 16, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fcActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7A1F2B" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#7A1F2B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F2" vertical={false} />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={48} />
                  <Tooltip formatter={(v: number) => formatNumber(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="aktual" name="Aktual" stroke="#7A1F2B" strokeWidth={2.5} fill="url(#fcActual)" connectNulls />
                  <Area type="monotone" dataKey="prediksi" name="Proyeksi" stroke="#7C3AED" strokeWidth={2.5} strokeDasharray="6 4" fill="none" connectNulls />
                  {peak && (
                    <ReferenceDot x={peak.tanggal} y={peak.value} r={5} fill="#7C3AED" stroke="#fff" strokeWidth={2}
                      label={{ value: `Puncak: ${formatNumber(peak.value)}`, position: 'top', fontSize: 11, fill: '#7C3AED' }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* ===== TEMUAN POLA ===== */}
          {result.temuan_pola && (
            <Card className="mt-4" icon={<Lightbulb className="h-5 w-5" />} title="Temuan Pola">
              <p className="text-sm leading-relaxed text-slate-600">{result.temuan_pola}</p>
            </Card>
          )}

          {/* ===== MATRIKS PREDIKSI ===== */}
          <Card
            className="mt-4"
            title="Matriks Prediksi Muatan & Alokasi Per Rute"
            subtitle="Estimasi load factor dan rekomendasi armada"
            icon={<Gauge className="h-5 w-5" />}
            noPadding
          >
            <Table
              columns={matriksColumns}
              data={result.matriks ?? []}
              keyField={(r) => r.rute}
              emptyMessage="Belum ada matriks prediksi untuk ditampilkan."
            />
          </Card>
        </>
      ) : !canWrite ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Lock className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-slate-800">Model forecasting hanya dapat dijalankan oleh Admin</p>
              <p className="mt-1 text-sm text-slate-500">
                Hubungi Admin untuk menjalankan prediksi demand pada koridor yang diinginkan.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CenterSpinner label="Menyiapkan model..." />
        </Card>
      )}
    </div>
  );
}
