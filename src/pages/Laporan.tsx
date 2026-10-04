import { useState } from 'react';
import { Check, ClipboardList, Download, FileDown, FileText, Lock, Send, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge, { type BadgeTone } from '../components/Badge';
import Modal from '../components/Modal';
import Table, { type Column } from '../components/Table';
import ErrorState from '../components/ErrorState';
import { useAsync } from '../lib/useAsync';
import { getErrorMessage } from '../api/client';
import {
  ajukanPermintaan,
  getOpsiLaporan,
  getPermintaan,
  prosesPermintaan,
  unduhLaporan,
  unduhPermintaan,
} from '../api/laporan';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type {
  FormatLaporan,
  JenisLaporan,
  PermintaanLaporan,
  StatusPermintaan,
} from '../types/laporan';

const fieldClass =
  'h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-slate-800 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100 disabled:bg-slate-50 disabled:text-slate-500';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

const JENIS: { value: JenisLaporan; label: string; deskripsi: string }[] = [
  { value: 'ringkasan', label: 'Ringkasan Lengkap', deskripsi: 'Performa, segmentasi, dan forecasting dalam satu laporan.' },
  { value: 'performa', label: 'Performa Rute & Cabang', deskripsi: 'Trip, penumpang, pendapatan, dan okupansi per rute & cabang.' },
  { value: 'segmentasi', label: 'Segmentasi Pelanggan', deskripsi: 'Ringkasan cluster RFM + K-Means dan metrik evaluasinya.' },
  { value: 'forecasting', label: 'Forecasting Permintaan', deskripsi: 'Model terpilih, MAPE/MAE/RMSE, dan prediksi 30 hari per rute.' },
];
const LABEL_JENIS = Object.fromEntries(JENIS.map((j) => [j.value, j.label])) as Record<JenisLaporan, string>;

const STATUS: Record<StatusPermintaan, { label: string; tone: BadgeTone }> = {
  menunggu: { label: 'Menunggu', tone: 'amber' },
  selesai: { label: 'Selesai', tone: 'green' },
  ditolak: { label: 'Ditolak', tone: 'red' },
};

const LABEL_ROLE: Record<string, string> = { Admin: 'Admin', Owner: 'Owner', KepalaOutlet: 'Kepala Outlet' };

function formatTanggal(iso: string | null): string {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'medium' });
}

function formatWaktu(iso: string): string {
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function teksPeriode(mulai: string | null, selesai: string | null): string {
  if (!mulai && !selesai) return 'Seluruh data';
  return `${formatTanggal(mulai) || 'awal'} – ${formatTanggal(selesai) || 'akhir'}`;
}

/** Field bersama: jenis, periode, cabang. */
interface FormLaporan {
  jenis: JenisLaporan;
  mulai: string;
  selesai: string;
  cabang: string;
}

function FieldLaporan({
  form,
  setForm,
  cabangList,
  cabangTerkunci,
}: {
  form: FormLaporan;
  setForm: (f: FormLaporan) => void;
  cabangList: string[];
  cabangTerkunci: string | null;
}) {
  return (
    <>
      <div className="sm:col-span-2">
        <label className={labelClass}>Jenis laporan</label>
        <select
          value={form.jenis}
          onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisLaporan })}
          className={fieldClass}
        >
          {JENIS.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">{JENIS.find((j) => j.value === form.jenis)?.deskripsi}</p>
      </div>
      <div>
        <label className={labelClass}>Tanggal mulai</label>
        <input
          type="date"
          value={form.mulai}
          max={form.selesai || undefined}
          onChange={(e) => setForm({ ...form, mulai: e.target.value })}
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass}>Tanggal selesai</label>
        <input
          type="date"
          value={form.selesai}
          min={form.mulai || undefined}
          onChange={(e) => setForm({ ...form, selesai: e.target.value })}
          className={fieldClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>
          Cabang
          {cabangTerkunci && <Lock className="ml-1 inline h-3 w-3 text-slate-400" />}
        </label>
        <select
          value={cabangTerkunci ?? form.cabang}
          disabled={!!cabangTerkunci}
          onChange={(e) => setForm({ ...form, cabang: e.target.value })}
          className={fieldClass}
        >
          {!cabangTerkunci && <option value="">Semua cabang</option>}
          {cabangList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {cabangTerkunci && (
          <p className="mt-1 text-xs text-slate-400">Kepala Outlet hanya dapat membuat laporan untuk cabangnya.</p>
        )}
      </div>
    </>
  );
}

const FORM_AWAL: FormLaporan = { jenis: 'ringkasan', mulai: '', selesai: '', cabang: '' };

export default function Laporan() {
  const { role } = useAuth();
  const toast = useToast();
  const isAdmin = role === 'Admin';

  const opsi = useAsync(getOpsiLaporan, []);
  const permintaan = useAsync(getPermintaan, []);
  const cabangList = opsi.data?.cabang ?? [];
  const cabangTerkunci = opsi.data?.cabang_terkunci ?? null;

  // --- Buat laporan langsung ---
  const [form, setForm] = useState<FormLaporan>(FORM_AWAL);
  const [format, setFormat] = useState<FormatLaporan>('pdf');
  const [mengunduh, setMengunduh] = useState(false);

  const buatLaporan = async () => {
    if (form.mulai && form.selesai && form.mulai > form.selesai) {
      toast.error('Tanggal mulai tidak boleh setelah tanggal selesai.');
      return;
    }
    setMengunduh(true);
    try {
      await unduhLaporan({
        jenis: form.jenis,
        format,
        tanggal_mulai: form.mulai || undefined,
        tanggal_selesai: form.selesai || undefined,
        cabang: cabangTerkunci ?? (form.cabang || undefined),
      });
      toast.success('Laporan berhasil dibuat dan diunduh.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal membuat laporan.'));
    } finally {
      setMengunduh(false);
    }
  };

  // --- Ajukan permintaan (Owner / Kepala Outlet) ---
  const [formMinta, setFormMinta] = useState<FormLaporan>(FORM_AWAL);
  const [catatan, setCatatan] = useState('');
  const [mengirim, setMengirim] = useState(false);

  const kirimPermintaan = async () => {
    if (formMinta.mulai && formMinta.selesai && formMinta.mulai > formMinta.selesai) {
      toast.error('Tanggal mulai tidak boleh setelah tanggal selesai.');
      return;
    }
    setMengirim(true);
    try {
      await ajukanPermintaan({
        jenis_laporan: formMinta.jenis,
        tanggal_mulai: formMinta.mulai || null,
        tanggal_selesai: formMinta.selesai || null,
        cabang: cabangTerkunci ?? (formMinta.cabang || null),
        catatan: catatan.trim() || null,
      });
      toast.success('Permintaan laporan terkirim ke Admin.');
      setFormMinta(FORM_AWAL);
      setCatatan('');
      permintaan.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengirim permintaan.'));
    } finally {
      setMengirim(false);
    }
  };

  // --- Proses permintaan (Admin) ---
  const [aksi, setAksi] = useState<{ p: PermintaanLaporan; status: 'selesai' | 'ditolak' } | null>(null);
  const [catatanAdmin, setCatatanAdmin] = useState('');
  const [memproses, setMemproses] = useState(false);

  const bukaAksi = (p: PermintaanLaporan, status: 'selesai' | 'ditolak') => {
    setAksi({ p, status });
    setCatatanAdmin('');
  };

  const simpanAksi = async () => {
    if (!aksi) return;
    if (aksi.status === 'ditolak' && !catatanAdmin.trim()) {
      toast.error('Isi alasan penolakan.');
      return;
    }
    setMemproses(true);
    try {
      await prosesPermintaan(aksi.p.id_permintaan, {
        status: aksi.status,
        catatan_admin: catatanAdmin.trim() || null,
      });
      toast.success(aksi.status === 'selesai' ? 'Permintaan diselesaikan.' : 'Permintaan ditolak.');
      setAksi(null);
      permintaan.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memproses permintaan.'));
    } finally {
      setMemproses(false);
    }
  };

  // --- Unduh hasil permintaan ---
  const [unduhId, setUnduhId] = useState<string | null>(null);
  const unduhHasil = async (p: PermintaanLaporan, fmt: FormatLaporan) => {
    setUnduhId(`${p.id_permintaan}-${fmt}`);
    try {
      await unduhPermintaan(p, fmt);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengunduh laporan.'));
    } finally {
      setUnduhId(null);
    }
  };

  const kolom: Column<PermintaanLaporan>[] = [
    { key: 'dibuat_pada', header: 'Diajukan', render: (r) => formatWaktu(r.dibuat_pada) },
    ...(isAdmin
      ? [
          {
            key: 'pemohon',
            header: 'Pemohon',
            render: (r: PermintaanLaporan) => (
              <div className="leading-tight">
                <div className="font-medium text-slate-800">{r.nama_pemohon ?? '-'}</div>
                <div className="text-xs text-slate-400">{LABEL_ROLE[r.role_pemohon ?? ''] ?? r.role_pemohon}</div>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'jenis',
      header: 'Laporan',
      render: (r) => (
        <div className="leading-tight">
          <div className="font-medium text-slate-800">{LABEL_JENIS[r.jenis_laporan] ?? r.jenis_laporan}</div>
          <div className="text-xs text-slate-400">
            {teksPeriode(r.tanggal_mulai, r.tanggal_selesai)} · {r.cabang ?? 'Semua cabang'}
          </div>
          {r.catatan && <div className="mt-0.5 max-w-xs truncate text-xs text-slate-500" title={r.catatan}>“{r.catatan}”</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="leading-tight">
          <Badge tone={STATUS[r.status].tone} dot>
            {STATUS[r.status].label}
          </Badge>
          {r.catatan_admin && (
            <div className="mt-1 max-w-xs truncate text-xs text-slate-500" title={r.catatan_admin}>
              Admin: {r.catatan_admin}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {isAdmin && r.status === 'menunggu' && (
            <>
              <Button size="sm" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => bukaAksi(r, 'selesai')}>
                Selesaikan
              </Button>
              <Button size="sm" variant="outline" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => bukaAksi(r, 'ditolak')}>
                Tolak
              </Button>
            </>
          )}
          {r.status === 'selesai' && (
            <>
              <Button
                size="sm"
                variant="subtle"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                loading={unduhId === `${r.id_permintaan}-pdf`}
                disabled={unduhId !== null}
                onClick={() => unduhHasil(r, 'pdf')}
              >
                PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                loading={unduhId === `${r.id_permintaan}-xlsx`}
                disabled={unduhId !== null}
                onClick={() => unduhHasil(r, 'xlsx')}
              >
                Excel
              </Button>
            </>
          )}
          {r.status === 'menunggu' && !isAdmin && <span className="text-xs text-slate-400">Diproses Admin</span>}
        </div>
      ),
    },
  ];

  const jumlahMenunggu = (permintaan.data ?? []).filter((p) => p.status === 'menunggu').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan"
        subtitle="Buat laporan analisis dalam format PDF atau Excel, dan kelola permintaan laporan."
        breadcrumb={['Laporan']}
      />

      <div className={isAdmin ? 'grid gap-6' : 'grid gap-6 lg:grid-cols-2'}>
        {/* Buat laporan */}
        <Card
          title="Buat Laporan"
          subtitle="Laporan dibuat dari data terbaru. Jenis ringkasan & forecasting bisa butuh beberapa menit."
          icon={<FileText className="h-5 w-5" />}
        >
          {opsi.error ? (
            <ErrorState compact message={opsi.error} onRetry={opsi.reload} />
          ) : (
            <div className={isAdmin ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4' : 'grid gap-4 sm:grid-cols-2'}>
              <FieldLaporan form={form} setForm={setForm} cabangList={cabangList} cabangTerkunci={cabangTerkunci} />
              <div className={isAdmin ? 'sm:col-span-2 lg:col-span-4' : 'sm:col-span-2'}>
                <label className={labelClass}>Format</label>
                <div className="flex flex-wrap items-center gap-2">
                  {(['pdf', 'xlsx'] as FormatLaporan[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={
                        format === f
                          ? 'h-10 rounded-lg border border-maroon-400 bg-maroon-50 px-4 text-sm font-semibold text-maroon-700'
                          : 'h-10 rounded-lg border border-hairline bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50'
                      }
                    >
                      {f === 'pdf' ? 'PDF' : 'Excel (.xlsx)'}
                    </button>
                  ))}
                  <Button
                    className="ml-auto"
                    leftIcon={<FileDown className="h-4 w-4" />}
                    loading={mengunduh}
                    disabled={opsi.loading}
                    onClick={buatLaporan}
                  >
                    {mengunduh ? 'Menyusun laporan...' : 'Unduh Laporan'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Ajukan permintaan (Owner / Kepala Outlet) */}
        {!isAdmin && (
          <Card
            title="Ajukan Permintaan Laporan"
            subtitle="Minta Admin menyiapkan laporan strategis; unduh setelah statusnya selesai."
            icon={<Send className="h-5 w-5" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldLaporan
                form={formMinta}
                setForm={setFormMinta}
                cabangList={cabangList}
                cabangTerkunci={cabangTerkunci}
              />
              <div className="sm:col-span-2">
                <label className={labelClass}>Catatan untuk Admin (opsional)</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Mis. untuk rapat evaluasi bulanan"
                  className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-slate-800 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100"
                />
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button leftIcon={<Send className="h-4 w-4" />} loading={mengirim} onClick={kirimPermintaan}>
                  Kirim Permintaan
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Daftar permintaan */}
      <Card
        title={isAdmin ? 'Permintaan Laporan' : 'Permintaan Saya'}
        subtitle={isAdmin ? 'Permintaan dari Owner & Kepala Outlet' : 'Status permintaan laporan yang Anda ajukan'}
        icon={<ClipboardList className="h-5 w-5" />}
        action={jumlahMenunggu > 0 ? <Badge tone="amber" size="md">{jumlahMenunggu} menunggu</Badge> : undefined}
        noPadding
      >
        {permintaan.error ? (
          <ErrorState compact message={permintaan.error} onRetry={permintaan.reload} />
        ) : (
          <Table
            columns={kolom}
            data={permintaan.data ?? []}
            loading={permintaan.loading}
            keyField={(r) => r.id_permintaan}
            emptyMessage="Belum ada permintaan laporan."
          />
        )}
      </Card>

      <Modal
        open={aksi !== null}
        onClose={() => !memproses && setAksi(null)}
        title={aksi?.status === 'selesai' ? 'Selesaikan Permintaan' : 'Tolak Permintaan'}
        subtitle={
          aksi
            ? `${LABEL_JENIS[aksi.p.jenis_laporan]} · ${aksi.p.nama_pemohon ?? ''} · ${teksPeriode(aksi.p.tanggal_mulai, aksi.p.tanggal_selesai)}`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setAksi(null)} disabled={memproses}>
              Batal
            </Button>
            <Button
              variant={aksi?.status === 'ditolak' ? 'danger' : 'primary'}
              loading={memproses}
              onClick={simpanAksi}
            >
              {aksi?.status === 'selesai' ? 'Selesaikan' : 'Tolak'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {aksi?.status === 'selesai' ? (
            <p className="text-sm text-slate-600">
              Pemohon akan dapat mengunduh laporan (PDF/Excel) yang dibuat dari parameter permintaan ini.
            </p>
          ) : (
            <p className="text-sm text-slate-600">Jelaskan alasan penolakan agar pemohon bisa mengajukan ulang.</p>
          )}
          <div>
            <label className={labelClass}>
              Catatan admin {aksi?.status === 'ditolak' ? '(wajib)' : '(opsional)'}
            </label>
            <textarea
              value={catatanAdmin}
              onChange={(e) => setCatatanAdmin(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-slate-800 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
