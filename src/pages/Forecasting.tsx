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
  BusFront,
  CalendarDays,
  CheckCircle2,
  Gauge,
  Layers,
  Lock,
  Play,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge, { type BadgeTone } from '../components/Badge';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import ProgressBar, { loadFactorColor } from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getRuteTersedia, runForecast } from '../api/forecasting';
import { getErrorMessage } from '../api/client';
import { formatNumber, formatPercent, namaModel } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type {
  ForecastDeretPoint,
  ForecastRunResponse,
  KategoriMape,
  PerbandinganModel,
} from '../types/forecasting';

const HORIZON = [7, 14, 30];
const VIEWS = [
  { value: 'harian', label: 'Harian' },
  { value: 'mingguan', label: 'Mingguan' },
  { value: 'bulanan', label: 'Bulanan' },
] as const;

type ViewMode = (typeof VIEWS)[number]['value'];

/** Warna badge kategori MAPE menurut Lewis (1982). */
const KATEGORI_TONE: Record<KategoriMape, BadgeTone> = {
  'Sangat baik': 'green',
  Baik: 'blue',
  Layak: 'amber',
  Buruk: 'red',
};

const LABEL_EKSOGEN: Record<string, string> = {
  weekend: 'akhir pekan',
  libur_nasional: 'libur nasional',
  sekitar_libur: 'H-1/H+1 libur nasional',
  libur_sekolah: 'libur sekolah',
};

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
  const [horizon, setHorizon] = useState(30);
  const [pakaiKalender, setPakaiKalender] = useState(true);
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
    async (r: string, h: number, kalender: boolean) => {
      if (!r) return;
      setRunning(true);
      setError(null);
      try {
        const res = await runForecast({ rute: r, horizon_hari: h, pakai_kalender: kalender });
        setResult(res);
        toast.success(
          res.dari_cache
            ? `Hasil ${namaModel(res.model)} diambil dari cache (data belum berubah).`
            : `Model terpilih: ${namaModel(res.model)} (${formatNumber(res.durasi_detik)} detik).`,
        );
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
      run(rute, horizon, pakaiKalender);
    }
  }, [canWrite, rute, horizon, pakaiKalender, run]);

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

  const perbandinganColumns: Column<PerbandinganModel>[] = [
    {
      key: 'model',
      header: 'Model',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className={r.terpilih ? 'font-semibold text-maroon-700' : 'text-slate-700'}>{namaModel(r.model)}</span>
          {r.terpilih && (
            <Badge tone="maroon" size="sm">
              Terpilih
            </Badge>
          )}
        </div>
      ),
    },
    { key: 'mae', header: 'MAE', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.mae)}</span> },
    { key: 'rmse', header: 'RMSE', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.rmse)}</span> },
    {
      key: 'mape_persen',
      header: 'MAPE',
      align: 'right',
      render: (r) => (
        <span className={`tabular-nums ${r.terpilih ? 'font-semibold text-slate-900' : ''}`}>{formatPercent(r.mape_persen, 2)}</span>
      ),
    },
    {
      key: 'kategori_mape',
      header: 'Kategori (Lewis)',
      render: (r) => <Badge tone={KATEGORI_TONE[r.kategori_mape]}>{r.kategori_mape}</Badge>,
    },
  ];

  const selectClass =
    'h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-slate-700 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

  return (
    <div>
      <PageHeader
        badge={{ label: 'Forecasting Deret Waktu', tone: 'purple', dot: true }}
        title="Forecasting Demand & Prediksi Muatan Armada"
        subtitle="Bandingkan ARIMA, SARIMA, SARIMAX dan Holt-Winters per koridor, lalu pakai model dengan MAPE terkecil."
        actions={
          result ? (
            <Badge tone={result.valid ? 'green' : 'amber'} dot>
              {result.valid ? 'Model valid' : 'Model belum valid'} · MAPE {formatPercent(result.mape_persen, 1)}
            </Badge>
          ) : undefined
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
          <label
            className="flex h-10 items-center gap-2.5 rounded-lg border border-hairline px-3 text-sm text-slate-600"
            title="Tambahkan akhir pekan, libur nasional (termasuk H-1/H+1) dan libur sekolah dari tabel kalender sebagai variabel eksogen (model SARIMAX)."
          >
            <input
              type="checkbox"
              checked={pakaiKalender}
              onChange={(e) => setPakaiKalender(e.target.checked)}
              disabled={!canWrite}
              className="h-4 w-4 rounded border-slate-300 text-maroon-700 focus:ring-maroon-500 disabled:opacity-50"
            />
            Pertimbangkan kalender libur (SARIMAX)
          </label>
          {canWrite ? (
            <Button leftIcon={<Play className="h-4 w-4" />} loading={running} onClick={() => run(rute, horizon, pakaiKalender)}>
              Jalankan Model
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
          <ErrorState message={error} onRetry={() => run(rute, horizon, pakaiKalender)} />
        </Card>
      ) : running && !result ? (
        <Card>
          <CenterSpinner label="Membandingkan model prediksi (bisa sampai ±30 detik)..." />
        </Card>
      ) : result ? (
        <>
          {/* ===== 3 KARTU HASIL ===== */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Prediksi Demand {result.horizon_hari} Hari ke Depan</p>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-maroon-50 text-maroon-700"><TrendingUp className="h-5 w-5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-slate-900">{formatNumber(result.prediksi_periode_berikutnya)}</span>
                <span className="text-sm text-slate-400">pax</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Rata-rata <span className="font-semibold text-slate-600">{formatNumber(result.kapasitas.prediksi_rata_harian)}</span> pax/hari ·
                puncak <span className="font-semibold text-slate-600">{formatNumber(result.kapasitas.prediksi_puncak_harian)}</span> pax (
                {result.kapasitas.tanggal_puncak})
              </p>
            </Card>

            <Card>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Akurasi Model (data uji {result.hari_uji} hari)</p>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-green-50 text-green-600"><Target className="h-5 w-5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-slate-900">{formatPercent(result.mape_persen, 2)}</span>
                <span className="text-sm text-slate-400">MAPE</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone={KATEGORI_TONE[result.kategori_mape]}>{result.kategori_mape}</Badge>
                <Badge tone={result.valid ? 'green' : 'red'}>
                  {result.valid ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
                  {result.valid ? 'Valid' : 'Tidak valid'} (MAPE ≤ {formatPercent(result.mape_maks_valid, 0)})
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                MAE <span className="font-semibold text-slate-600">{formatNumber(result.mae)}</span> · RMSE{' '}
                <span className="font-semibold text-slate-600">{formatNumber(result.rmse)}</span> pax/hari
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Model <span className="font-semibold text-slate-600">{namaModel(result.model)}</span>
              </p>
            </Card>

            <Card>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">Rekomendasi Penambahan Unit</p>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-600"><BusFront className="h-5 w-5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-slate-900">+{formatNumber(result.rekomendasi_unit_tambahan)}</span>
                <span className="text-sm text-slate-400">perjalanan/hari puncak</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{result.catatan_jadwal}</p>
            </Card>
          </div>

          {/* ===== CHART BESAR ===== */}
          <Card
            className="mt-4"
            title="Proyeksi Demand: Aktual vs Prediksi"
            subtitle={`Koridor ${result.rute} · horizon ${result.horizon_hari} hari · ${namaModel(result.model)}`}
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

          {/* ===== PERBANDINGAN MODEL ===== */}
          <Card
            className="mt-4"
            title="Perbandingan Model"
            subtitle={`Dievaluasi pada ${result.hari_uji} hari terakhir; model dengan MAPE terkecil dipakai untuk prediksi`}
            icon={<Layers className="h-5 w-5" />}
            noPadding
          >
            <Table
              columns={perbandinganColumns}
              data={result.perbandingan}
              keyField={(r) => r.model}
              emptyMessage="Tidak ada model yang berhasil dilatih."
            />
            <p className="border-t border-hairline px-5 py-3 text-xs leading-relaxed text-slate-400">
              Data latih {result.jendela_latih_hari} hari ({result.periode_data.mulai} s.d. {result.periode_data.selesai}), uji ADF
              p-value {result.adf_p_value} (d = {result.ordo_differencing}).{' '}
              {result.uji_residual &&
                `Uji residual ${result.uji_residual.metode} (lag ${result.uji_residual.lag}): p-value ${result.uji_residual.p_value} — ${
                  result.uji_residual.lolos
                    ? 'residual tidak berautokorelasi.'
                    : 'residual masih berautokorelasi, masih ada pola yang belum tertangkap model.'
                } `}
              {result.pakai_kalender
                ? result.variabel_eksogen.length > 0
                  ? `Variabel kalender model terpilih: ${result.variabel_eksogen.map((v) => LABEL_EKSOGEN[v] ?? v).join(', ')}.`
                  : 'Kalender libur diikutkan sebagai kandidat SARIMAX.'
                : 'Kalender libur tidak dipakai (SARIMAX tidak diikutkan).'}{' '}
              Kategori MAPE menurut Lewis (1982): &lt;10% sangat baik, 10–20% baik, 20–50% layak, &gt;50% buruk.
            </p>
          </Card>

          {/* ===== KAPASITAS ===== */}
          <Card
            className="mt-4"
            title="Prediksi Muatan vs Kapasitas Jadwal"
            subtitle={`Kapasitas dari rata-rata 90 hari terakhir · target load factor ${formatPercent(result.kapasitas.target_load_factor_persen, 0)}`}
            icon={<Gauge className="h-5 w-5" />}
          >
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Perjalanan/hari</p>
                <p className="text-lg font-bold tabular-nums text-slate-800">{formatNumber(result.kapasitas.perjalanan_per_hari)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kursi/hari</p>
                <p className="text-lg font-bold tabular-nums text-slate-800">
                  {formatNumber(result.kapasitas.kursi_per_hari)}
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    ({formatNumber(result.kapasitas.kapasitas_per_perjalanan)} kursi/unit)
                  </span>
                </p>
              </div>
              {[
                { label: 'Load factor rata-rata', value: result.kapasitas.load_factor_rata_persen },
                { label: 'Load factor hari puncak', value: result.kapasitas.load_factor_puncak_persen },
              ].map((lf) => (
                <div key={lf.label}>
                  <p className="text-xs text-slate-500">{lf.label}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={lf.value} color={loadFactorColor(lf.value)} height="sm" className="min-w-[80px]" />
                    <span className="w-12 text-right text-xs font-semibold tabular-nums text-slate-700">{formatPercent(lf.value, 0)}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {result.kapasitas.hari_perlu_tambahan > 0
                ? `${result.kapasitas.hari_perlu_tambahan} dari ${result.horizon_hari} hari diprediksi melewati ${formatPercent(result.kapasitas.target_load_factor_persen, 0)} kapasitas kursi.`
                : `Tidak ada hari yang diprediksi melewati ${formatPercent(result.kapasitas.target_load_factor_persen, 0)} kapasitas kursi.`}
            </p>
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
