import { useRef, useState, type DragEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  FileX,
  Rows3,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge, { type BadgeTone } from '../components/Badge';
import KpiCard from '../components/KpiCard';
import Table, { type Column } from '../components/Table';
import ErrorState from '../components/ErrorState';
import ProgressBar from '../components/ProgressBar';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getErrorMessage } from '../api/client';
import { getRiwayatImport, getStatusData, importTransaksi, unduhTemplate } from '../api/importData';
import { classNames, formatNumber } from '../lib/format';
import { useToast } from '../context/ToastContext';
import type { HasilImport, KategoriTolak, RiwayatImport, SampelDitolak } from '../types/importData';

const MAKS_MB = 50;

const KATEGORI: Record<KategoriTolak, { label: string; tone: BadgeTone }> = {
  kosong: { label: 'Kolom kosong', tone: 'slate' },
  tidak_valid: { label: 'Tidak valid', tone: 'red' },
  duplikat: { label: 'Duplikat di file', tone: 'amber' },
  sudah_ada: { label: 'Sudah ada di DB', tone: 'blue' },
};

function formatWaktu(iso: string): string {
  // Backend menyimpan waktu UTC tanpa zona; tambahkan 'Z' agar dikonversi ke waktu lokal.
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTanggal(iso: string | null): string {
  if (!iso) return '-';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'medium' });
}

export default function ImportData() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [proses, setProses] = useState<'validasi' | 'import' | null>(null);
  const [progress, setProgress] = useState(0);
  const [hasil, setHasil] = useState<HasilImport | null>(null);
  const [unduhTpl, setUnduhTpl] = useState(false);

  const status = useAsync(getStatusData, []);
  const riwayat = useAsync(getRiwayatImport, []);

  const pilihFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('File harus berformat .csv');
      return;
    }
    if (f.size > MAKS_MB * 1024 * 1024) {
      toast.error(`Ukuran file melebihi ${MAKS_MB} MB`);
      return;
    }
    setFile(f);
    setHasil(null);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    pilihFile(e.dataTransfer.files?.[0]);
  };

  const jalankan = async (dryRun: boolean) => {
    if (!file) return;
    setProses(dryRun ? 'validasi' : 'import');
    setProgress(0);
    try {
      const res = await importTransaksi(file, dryRun, setProgress);
      setHasil(res);
      if (dryRun) {
        toast.info(`Validasi selesai: ${formatNumber(res.baris_lolos)} baris siap dimuat.`);
      } else if (res.status === 'berhasil') {
        toast.success(`Import berhasil: ${formatNumber(res.baris_dimuat)} baris dimuat.`);
        status.reload();
        riwayat.reload();
      } else {
        toast.error(res.catatan ?? 'Import gagal.');
        riwayat.reload();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memproses file.'));
    } finally {
      setProses(null);
    }
  };

  const templateClick = async () => {
    setUnduhTpl(true);
    try {
      await unduhTemplate();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengunduh template.'));
    } finally {
      setUnduhTpl(false);
    }
  };

  const kolomSampel: Column<SampelDitolak>[] = [
    { key: 'baris', header: 'Baris', render: (r) => <span className="tabular-nums">{r.baris}</span> },
    {
      key: 'kode_transaksi',
      header: 'Kode Transaksi',
      render: (r) => <span className="font-mono text-xs">{r.kode_transaksi ?? '-'}</span>,
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (r) => <Badge tone={KATEGORI[r.kategori].tone}>{KATEGORI[r.kategori].label}</Badge>,
    },
    { key: 'alasan', header: 'Alasan', render: (r) => <span className="text-slate-600">{r.alasan}</span> },
  ];

  const kolomRiwayat: Column<RiwayatImport>[] = [
    { key: 'waktu', header: 'Waktu', render: (r) => formatWaktu(r.waktu) },
    {
      key: 'nama_file',
      header: 'File',
      render: (r) => <span className="font-medium text-slate-800">{r.nama_file}</span>,
    },
    { key: 'diimport_oleh', header: 'Oleh', render: (r) => r.diimport_oleh ?? '-' },
    { key: 'baris_sumber', header: 'Sumber', align: 'right', render: (r) => formatNumber(r.baris_sumber) },
    {
      key: 'dibuang',
      header: 'Dibuang',
      align: 'right',
      render: (r) =>
        formatNumber(r.baris_kosong + r.baris_tidak_valid + r.baris_duplikat + r.baris_sudah_ada),
    },
    {
      key: 'baris_dimuat',
      header: 'Dimuat',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatNumber(r.baris_dimuat)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={r.status === 'berhasil' ? 'green' : 'red'} dot>
          {r.status === 'berhasil' ? 'Berhasil' : 'Gagal'}
        </Badge>
      ),
    },
  ];

  const sd = status.data;
  const persenMin = sd ? Math.min(100, (sd.total_baris / sd.min_baris_analisis) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Data Transaksi"
        subtitle="Unggah file CSV transaksi. Sistem membersihkan data (baris kosong, nilai tidak valid, duplikat) sebelum dimuat ke database."
        breadcrumb={['Data', 'Import CSV']}
        actions={
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={templateClick}
            loading={unduhTpl}
          >
            Unduh Template CSV
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload */}
        <Card
          className="lg:col-span-2"
          title="Unggah File CSV"
          subtitle={`Maksimal ${MAKS_MB} MB, format sesuai template`}
          icon={<Upload className="h-5 w-5" />}
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
            }}
            className={classNames(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
              drag ? 'border-maroon-400 bg-maroon-50/60' : 'border-hairline bg-slate-50/60 hover:bg-slate-50',
            )}
          >
            <FileSpreadsheet className="h-10 w-10 text-maroon-600" />
            <p className="text-sm font-semibold text-slate-700">
              Tarik & lepas file CSV di sini, atau <span className="text-maroon-700 underline">pilih file</span>
            </p>
            <p className="text-xs text-slate-400">
              Kolom wajib: Kode Transaksi, Tanggal, Jam Keberangkatan, Rute, Layanan, Jenis Transaksi,
              Jumlah Unit, Channel Pemesanan, Total Bayar
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                pilihFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-hairline px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!proses && (
                <button
                  onClick={() => {
                    setFile(null);
                    setHasil(null);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Hapus file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {proses && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  {progress < 100
                    ? 'Mengunggah file...'
                    : proses === 'validasi'
                      ? 'Membersihkan & memvalidasi data...'
                      : 'Membersihkan & memuat data ke database...'}
                </span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <ProgressBar value={progress} height="sm" />
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              leftIcon={<ShieldCheck className="h-4 w-4" />}
              disabled={!file || proses !== null}
              loading={proses === 'validasi'}
              onClick={() => jalankan(true)}
            >
              Validasi dulu
            </Button>
            <Button
              leftIcon={<Upload className="h-4 w-4" />}
              disabled={!file || proses !== null}
              loading={proses === 'import'}
              onClick={() => jalankan(false)}
            >
              Import
            </Button>
          </div>
        </Card>

        {/* Status data */}
        <Card title="Status Dataset" subtitle="Syarat minimal data untuk analisis" icon={<Database className="h-5 w-5" />}>
          {status.loading ? (
            <CenterSpinner />
          ) : status.error || !sd ? (
            <ErrorState compact message={status.error ?? undefined} onRetry={status.reload} />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Total baris transaksi</p>
                <p className="text-2xl font-extrabold tabular-nums text-slate-900">
                  {formatNumber(sd.total_baris)}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Minimal {formatNumber(sd.min_baris_analisis)} baris</span>
                  <span className="tabular-nums">{persenMin.toFixed(0)}%</span>
                </div>
                <ProgressBar value={persenMin} color={sd.siap_dianalisis ? 'green' : 'amber'} />
              </div>
              <Badge tone={sd.siap_dianalisis ? 'green' : 'amber'} dot size="md">
                {sd.siap_dianalisis ? 'Siap dianalisis' : 'Belum cukup untuk analisis'}
              </Badge>
              <dl className="space-y-1.5 border-t border-hairline pt-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Rentang tanggal</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {formatTanggal(sd.tanggal_awal)} – {formatTanggal(sd.tanggal_akhir)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Import terakhir</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {sd.import_terakhir ? formatWaktu(sd.import_terakhir.waktu) : 'Belum pernah'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </Card>
      </div>

      {/* Hasil cleaning */}
      {hasil && (
        <Card
          title={hasil.dry_run ? 'Hasil Validasi (belum disimpan)' : 'Hasil Import'}
          subtitle={hasil.nama_file}
          icon={hasil.status === 'berhasil' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          action={
            hasil.dry_run ? (
              <Badge tone="blue" size="md">Dry run</Badge>
            ) : (
              <Badge tone={hasil.status === 'berhasil' ? 'green' : 'red'} size="md" dot>
                {hasil.status === 'berhasil' ? 'Berhasil' : 'Gagal'}
              </Badge>
            )
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Baris sumber"
              value={formatNumber(hasil.baris_sumber)}
              icon={<Rows3 className="h-5 w-5" />}
              subtitle={
                hasil.baris_kosong_penuh
                  ? `${formatNumber(hasil.baris_kosong_penuh)} baris kosong total sudah dibuang`
                  : 'Setelah trim & buang baris kosong'
              }
            />
            <KpiCard
              title={hasil.dry_run ? 'Lolos cleaning' : 'Berhasil dimuat'}
              value={formatNumber(hasil.dry_run ? hasil.baris_lolos : hasil.baris_dimuat)}
              icon={<CheckCircle2 className="h-5 w-5" />}
              subtitle={hasil.dry_run ? 'Siap dimuat saat Import' : 'Masuk ke tabel transaksi'}
            />
            <KpiCard
              title="Kosong / tidak valid"
              value={formatNumber(hasil.baris_kosong + hasil.baris_tidak_valid)}
              icon={<FileX className="h-5 w-5" />}
              subtitle={`${formatNumber(hasil.baris_kosong)} kolom wajib kosong, ${formatNumber(hasil.baris_tidak_valid)} nilai tidak valid`}
            />
            <KpiCard
              title="Duplikat"
              value={formatNumber(hasil.baris_duplikat + hasil.baris_sudah_ada)}
              icon={<Copy className="h-5 w-5" />}
              subtitle={`${formatNumber(hasil.baris_duplikat)} di file, ${formatNumber(hasil.baris_sudah_ada)} sudah ada di DB`}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>
              Total data {hasil.dry_run ? 'setelah import nanti' : 'sekarang'}:{' '}
              <b className="tabular-nums">{formatNumber(hasil.total_data_setelah)}</b> baris
            </span>
            <Badge tone={hasil.siap_dianalisis ? 'green' : 'amber'} dot>
              {hasil.siap_dianalisis
                ? 'Siap dianalisis'
                : `Belum mencapai ${formatNumber(hasil.min_baris_analisis)} baris`}
            </Badge>
            {Object.entries(hasil.entitas_baru).some(([, n]) => n > 0) && (
              <span className="text-xs text-slate-500">
                Data master baru:{' '}
                {Object.entries(hasil.entitas_baru)
                  .filter(([, n]) => n > 0)
                  .map(([k, n]) => `${n} ${k.replace('_', ' ')}`)
                  .join(', ')}
              </span>
            )}
          </div>
          {hasil.catatan && <p className="mt-2 text-sm text-red-600">{hasil.catatan}</p>}

          {hasil.sampel_ditolak.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contoh baris yang ditolak
              </h4>
              <div className="rounded-lg border border-hairline">
                <Table
                  columns={kolomSampel}
                  data={hasil.sampel_ditolak}
                  keyField={(r) => `${r.baris}-${r.kategori}`}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Riwayat */}
      <Card title="Riwayat Import" subtitle="Log setiap import beserta hasil cleaning" noPadding>
        {riwayat.error ? (
          <ErrorState compact message={riwayat.error} onRetry={riwayat.reload} />
        ) : (
          <Table
            columns={kolomRiwayat}
            data={riwayat.data ?? []}
            loading={riwayat.loading}
            keyField={(r) => r.id_import}
            emptyMessage="Belum ada riwayat import."
          />
        )}
      </Card>
    </div>
  );
}
