import { useState } from 'react';
import { Check, UserCheck, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge, { type BadgeTone } from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table, { type Column } from '../components/Table';
import ErrorState from '../components/ErrorState';
import { useAsync } from '../lib/useAsync';
import { getCabang, getPengguna, setujuiPengguna, tolakPengguna } from '../api/pengguna';
import { getErrorMessage } from '../api/client';
import { initials } from '../lib/format';
import { useToast } from '../context/ToastContext';
import type { Pengguna, StatusPengguna, UserRole } from '../types';

const TABS: { value: StatusPengguna | ''; label: string }[] = [
  { value: 'menunggu', label: 'Menunggu Persetujuan' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: '', label: 'Semua' },
];

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Owner', label: 'Owner' },
  { value: 'KepalaOutlet', label: 'Kepala Outlet' },
];

const STATUS_TONE: Record<StatusPengguna, BadgeTone> = { menunggu: 'amber', aktif: 'green', ditolak: 'red' };
const STATUS_LABEL: Record<StatusPengguna, string> = { menunggu: 'Menunggu', aktif: 'Aktif', ditolak: 'Ditolak' };

const fieldClass =
  'h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-slate-800 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100';

function formatTanggal(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function KelolaPengguna() {
  const toast = useToast();
  const [tab, setTab] = useState<StatusPengguna | ''>('menunggu');
  const { data, loading, error, reload } = useAsync(() => getPengguna(tab || undefined), [tab]);
  const cabang = useAsync(getCabang, []);

  const [target, setTarget] = useState<Pengguna | null>(null);
  const [role, setRole] = useState<UserRole>('KepalaOutlet');
  const [idCabang, setIdCabang] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [menolakId, setMenolakId] = useState<string | null>(null);

  const bukaSetujui = (p: Pengguna) => {
    setTarget(p);
    setRole('KepalaOutlet');
    setIdCabang(cabang.data?.[0]?.id_cabang ?? '');
  };

  const simpanPersetujuan = async () => {
    if (!target) return;
    setMenyimpan(true);
    try {
      await setujuiPengguna(target.id_pengguna, {
        role,
        id_cabang: role === 'KepalaOutlet' ? idCabang : undefined,
      });
      toast.success(`Akun ${target.nama} disetujui. Email pemberitahuan dikirim.`);
      setTarget(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyetujui akun.'));
    } finally {
      setMenyimpan(false);
    }
  };

  const tolak = async (p: Pengguna) => {
    if (!window.confirm(`Tolak pendaftaran ${p.nama} (${p.email})?`)) return;
    setMenolakId(p.id_pengguna);
    try {
      await tolakPengguna(p.id_pengguna);
      toast.success(`Pendaftaran ${p.nama} ditolak.`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menolak pendaftaran.'));
    } finally {
      setMenolakId(null);
    }
  };

  const namaCabang = (id?: string | null) => cabang.data?.find((c) => c.id_cabang === id)?.nama_cabang;

  const columns: Column<Pengguna>[] = [
    {
      key: 'nama',
      header: 'Pengguna',
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-maroon-100 text-xs font-bold text-maroon-700">
            {initials(p.nama)}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-slate-800">{p.nama}</div>
            <div className="truncate text-xs text-slate-400">{p.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email_terverifikasi',
      header: 'Email',
      render: (p) =>
        p.email_terverifikasi ? (
          <Badge tone="green">Terverifikasi</Badge>
        ) : (
          <Badge tone="slate">Belum verifikasi</Badge>
        ),
    },
    {
      key: 'role',
      header: 'Peran',
      render: (p) =>
        p.role ? (
          <span className="text-slate-700">
            {ROLES.find((r) => r.value === p.role)?.label ?? p.role}
            {p.role === 'KepalaOutlet' && namaCabang(p.id_cabang) && (
              <span className="text-xs text-slate-400"> · {namaCabang(p.id_cabang)}</span>
            )}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge tone={STATUS_TONE[p.status]} dot>
          {STATUS_LABEL[p.status]}
        </Badge>
      ),
    },
    { key: 'dibuat_pada', header: 'Terdaftar', render: (p) => <span className="tabular-nums text-slate-500">{formatTanggal(p.dibuat_pada)}</span> },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (p) =>
        p.status === 'menunggu' ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<X className="h-3.5 w-3.5" />}
              loading={menolakId === p.id_pengguna}
              onClick={() => tolak(p)}
            >
              Tolak
            </Button>
            <Button
              size="sm"
              leftIcon={<Check className="h-3.5 w-3.5" />}
              disabled={!p.email_terverifikasi}
              title={p.email_terverifikasi ? undefined : 'Menunggu pengguna memverifikasi email'}
              onClick={() => bukaSetujui(p)}
            >
              Setujui
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb={['Pengaturan', 'Kelola Pengguna']}
        title="Kelola Pengguna"
        subtitle="Tinjau pendaftar baru, tetapkan peran, dan kelola akses ke SIRADA Kencana."
      />

      <Card noPadding>
        <div className="flex flex-wrap gap-1.5 border-b border-hairline px-5 py-3">
          {TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => setTab(t.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                tab === t.value ? 'bg-maroon-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {error ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : (
          <Table
            columns={columns}
            data={data ?? []}
            keyField={(p) => p.id_pengguna}
            loading={loading}
            emptyMessage={tab === 'menunggu' ? 'Tidak ada pendaftar yang menunggu persetujuan.' : 'Tidak ada pengguna.'}
          />
        )}
      </Card>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title="Setujui Akun"
        subtitle={target ? `${target.nama} · ${target.email}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Batal
            </Button>
            <Button
              leftIcon={<UserCheck className="h-4 w-4" />}
              loading={menyimpan}
              disabled={role === 'KepalaOutlet' && !idCabang}
              onClick={simpanPersetujuan}
            >
              Setujui & Aktifkan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Peran</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={fieldClass}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {role === 'Admin' && (
              <p className="mt-1.5 text-xs text-amber-700">
                Admin dapat menambah transaksi, menjalankan model AI, dan menyetujui akun lain.
              </p>
            )}
          </div>
          {role === 'KepalaOutlet' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Cabang</label>
              <select value={idCabang} onChange={(e) => setIdCabang(e.target.value)} className={fieldClass}>
                {(cabang.data ?? []).map((c) => (
                  <option key={c.id_cabang} value={c.id_cabang}>
                    {c.nama_cabang}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="text-xs text-slate-400">Pengguna akan menerima email bahwa akunnya sudah aktif.</p>
        </div>
      </Modal>
    </div>
  );
}
