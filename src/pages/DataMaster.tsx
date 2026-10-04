import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Building2, Bus, Clock, Pencil, Plus, Route as RouteIcon, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge, { layananTone } from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table, { type Column } from '../components/Table';
import ErrorState from '../components/ErrorState';
import { useAsync } from '../lib/useAsync';
import {
  createArmada,
  createJadwal,
  createRute,
  deleteArmada,
  deleteJadwal,
  deleteRute,
  getArmadaMaster,
  getCabangMaster,
  getJadwalMaster,
  getRuteMaster,
  updateArmada,
  updateJadwal,
  updateRute,
} from '../api/master';
import { getErrorMessage } from '../api/client';
import { formatNumber } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type {
  ArmadaInput,
  ArmadaMaster,
  CabangMaster,
  JadwalInput,
  JadwalMaster,
  LayananKelas,
  RuteInput,
  RuteMaster,
} from '../types/master';

type Tab = 'rute' | 'armada' | 'jadwal' | 'cabang';

const TABS: { value: Tab; label: string; icon: ReactNode }[] = [
  { value: 'rute', label: 'Rute', icon: <RouteIcon className="h-3.5 w-3.5" /> },
  { value: 'armada', label: 'Armada', icon: <Bus className="h-3.5 w-3.5" /> },
  { value: 'jadwal', label: 'Jadwal', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'cabang', label: 'Cabang', icon: <Building2 className="h-3.5 w-3.5" /> },
];

const LAYANAN: LayananKelas[] = ['VIP', 'Reguler'];
const HARI_BERLAKU = ['Setiap Hari', 'Senin-Jumat', 'Sabtu-Minggu'];

const fieldClass =
  'h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-slate-800 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100 disabled:bg-slate-50 disabled:text-slate-500';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

function pecahLayanan(s: string): LayananKelas[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter((x): x is LayananKelas => x === 'VIP' || x === 'Reguler');
}

/** Status target hapus: jenis + id + label untuk dialog konfirmasi. */
type TargetHapus =
  | { jenis: 'rute'; data: RuteMaster }
  | { jenis: 'armada'; data: ArmadaMaster }
  | { jenis: 'jadwal'; data: JadwalMaster };

export default function DataMaster() {
  const { role } = useAuth();
  const toast = useToast();
  const bisaKelola = role === 'Admin' || role === 'KepalaOutlet';
  const isKepala = role === 'KepalaOutlet';

  const [tab, setTab] = useState<Tab>('rute');
  const cabang = useAsync(getCabangMaster, []);
  const rute = useAsync(getRuteMaster, []);
  const armada = useAsync(getArmadaMaster, []);
  const jadwal = useAsync(() => getJadwalMaster(), []);

  const cabangSaya = cabang.data?.find((c) => c.cabang_saya)?.nama_cabang;

  // ---- form state
  const [ruteForm, setRuteForm] = useState<{ id?: string; data: RuteInput } | null>(null);
  const [armadaForm, setArmadaForm] = useState<{ id?: string; data: ArmadaInput } | null>(null);
  const [jadwalForm, setJadwalForm] = useState<{ id?: string; data: JadwalInput } | null>(null);
  const [hapus, setHapus] = useState<TargetHapus | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  const cabangDefault = cabangSaya ?? cabang.data?.[0]?.nama_cabang ?? '';

  const bukaTambah = () => {
    if (tab === 'rute') {
      const tujuan = cabang.data?.find((c) => c.nama_cabang !== cabangDefault)?.nama_cabang ?? '';
      setRuteForm({ data: { cabang_asal: cabangDefault, cabang_tujuan: tujuan, layanan_tersedia: ['Reguler'] } });
    } else if (tab === 'armada') {
      setArmadaForm({
        data: { kode_armada: '', jenis_kendaraan: '', tipe_layanan: 'Reguler', kapasitas: 12, basis_outlet: cabangDefault },
      });
    } else if (tab === 'jadwal') {
      const r = rute.data?.[0];
      setJadwalForm({
        data: {
          id_rute: r?.id_rute ?? '',
          jam_keberangkatan: '07:00',
          layanan: (r ? pecahLayanan(r.layanan_tersedia)[0] : undefined) ?? 'Reguler',
          hari_berlaku: 'Setiap Hari',
        },
      });
    }
  };

  /** Jalankan aksi simpan/hapus dengan toast + reload daftar terkait. */
  const jalankan = async (aksi: () => Promise<unknown>, sukses: string, reloads: (() => void)[], tutup: () => void) => {
    setMenyimpan(true);
    try {
      await aksi();
      toast.success(sukses);
      tutup();
      reloads.forEach((r) => r());
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan perubahan.'));
    } finally {
      setMenyimpan(false);
    }
  };

  const simpanRute = (e: FormEvent) => {
    e.preventDefault();
    if (!ruteForm) return;
    const { id, data } = ruteForm;
    if (data.layanan_tersedia.length === 0) {
      toast.error('Pilih minimal satu layanan.');
      return;
    }
    const nama = `${data.cabang_asal}->${data.cabang_tujuan}`;
    jalankan(
      () => (id ? updateRute(id, data) : createRute(data)),
      id ? `Rute ${nama} diperbarui.` : `Rute ${nama} ditambahkan.`,
      [rute.reload, cabang.reload, jadwal.reload],
      () => setRuteForm(null),
    );
  };

  const simpanArmada = (e: FormEvent) => {
    e.preventDefault();
    if (!armadaForm) return;
    const { id, data } = armadaForm;
    jalankan(
      () => (id ? updateArmada(id, data) : createArmada(data)),
      id ? `Armada ${data.kode_armada.toUpperCase()} diperbarui.` : `Armada ${data.kode_armada.toUpperCase()} ditambahkan.`,
      [armada.reload, cabang.reload],
      () => setArmadaForm(null),
    );
  };

  const simpanJadwal = (e: FormEvent) => {
    e.preventDefault();
    if (!jadwalForm) return;
    const { id, data } = jadwalForm;
    jalankan(
      () => (id ? updateJadwal(id, data) : createJadwal(data)),
      id ? 'Jadwal diperbarui.' : `Jadwal ${data.jam_keberangkatan} ${data.layanan} ditambahkan.`,
      [jadwal.reload, rute.reload],
      () => setJadwalForm(null),
    );
  };

  const konfirmasiHapus = () => {
    if (!hapus) return;
    const tutup = () => setHapus(null);
    if (hapus.jenis === 'rute') {
      jalankan(() => deleteRute(hapus.data.id_rute), `Rute ${hapus.data.nama_rute} dihapus.`, [rute.reload, jadwal.reload, cabang.reload], tutup);
    } else if (hapus.jenis === 'armada') {
      jalankan(() => deleteArmada(hapus.data.id_armada), `Armada ${hapus.data.kode_armada} dihapus.`, [armada.reload, cabang.reload], tutup);
    } else {
      jalankan(() => deleteJadwal(hapus.data.id_jadwal), 'Jadwal dihapus.', [jadwal.reload, rute.reload], tutup);
    }
  };

  /** Kepala Outlet hanya boleh mengubah baris milik cabangnya (backend juga mengecek). */
  const bolehUbah = (cabangBaris?: string | null) => bisaKelola && (!isKepala || cabangBaris === cabangSaya);

  const aksiKolom = <T,>(cabangBaris: (r: T) => string | null | undefined, onEdit: (r: T) => void, onHapus: (r: T) => void, kunciHapus?: (r: T) => string | undefined): Column<T> => ({
    key: 'aksi',
    header: 'Aksi',
    align: 'right',
    render: (r) =>
      bolehUbah(cabangBaris(r)) ? (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => onEdit(r)}>
            Ubah
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="!text-red-600 hover:!bg-red-50"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            disabled={Boolean(kunciHapus?.(r))}
            title={kunciHapus?.(r)}
            onClick={() => onHapus(r)}
          >
            Hapus
          </Button>
        </div>
      ) : (
        <span className="text-xs text-slate-300">Hanya lihat</span>
      ),
  });

  // ---- kolom tabel
  const ruteColumns: Column<RuteMaster>[] = [
    {
      key: 'nama_rute',
      header: 'Rute',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
          {r.cabang_asal}
          <ArrowRight className="h-3.5 w-3.5 text-maroon-500" />
          {r.cabang_tujuan}
        </span>
      ),
    },
    {
      key: 'layanan_tersedia',
      header: 'Layanan',
      render: (r) => (
        <span className="inline-flex gap-1">
          {pecahLayanan(r.layanan_tersedia).map((l) => (
            <Badge key={l} tone={layananTone(l)}>
              {l}
            </Badge>
          ))}
        </span>
      ),
    },
    { key: 'jumlah_jadwal', header: 'Jadwal', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.jumlah_jadwal)}</span> },
    { key: 'jumlah_transaksi', header: 'Transaksi', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.jumlah_transaksi)}</span> },
    aksiKolom<RuteMaster>(
      (r) => r.cabang_asal,
      (r) =>
        setRuteForm({
          id: r.id_rute,
          data: { cabang_asal: r.cabang_asal, cabang_tujuan: r.cabang_tujuan, layanan_tersedia: pecahLayanan(r.layanan_tersedia) },
        }),
      (r) => setHapus({ jenis: 'rute', data: r }),
      (r) => (r.jumlah_transaksi > 0 ? `Dipakai ${formatNumber(r.jumlah_transaksi)} transaksi, tidak dapat dihapus` : undefined),
    ),
  ];

  const armadaColumns: Column<ArmadaMaster>[] = [
    { key: 'kode_armada', header: 'Kode Armada', render: (a) => <span className="font-semibold text-slate-800">{a.kode_armada}</span> },
    { key: 'jenis_kendaraan', header: 'Jenis Kendaraan' },
    { key: 'tipe_layanan', header: 'Layanan', render: (a) => <Badge tone={layananTone(a.tipe_layanan)}>{a.tipe_layanan}</Badge> },
    { key: 'kapasitas', header: 'Kapasitas', align: 'right', render: (a) => <span className="tabular-nums">{a.kapasitas} kursi</span> },
    { key: 'basis_outlet', header: 'Basis Cabang', render: (a) => a.basis_outlet ?? '—' },
    aksiKolom<ArmadaMaster>(
      (a) => a.basis_outlet,
      (a) =>
        setArmadaForm({
          id: a.id_armada,
          data: {
            kode_armada: a.kode_armada,
            jenis_kendaraan: a.jenis_kendaraan,
            tipe_layanan: (a.tipe_layanan as LayananKelas) ?? 'Reguler',
            kapasitas: a.kapasitas,
            basis_outlet: a.basis_outlet ?? cabangDefault,
          },
        }),
      (a) => setHapus({ jenis: 'armada', data: a }),
    ),
  ];

  const jadwalColumns: Column<JadwalMaster>[] = [
    { key: 'nama_rute', header: 'Rute', render: (j) => <span className="font-semibold text-slate-800">{j.nama_rute.replace('->', ' → ')}</span> },
    { key: 'jam_keberangkatan', header: 'Jam', render: (j) => <span className="tabular-nums">{j.jam_keberangkatan}</span> },
    { key: 'layanan', header: 'Layanan', render: (j) => <Badge tone={layananTone(j.layanan)}>{j.layanan}</Badge> },
    { key: 'hari_berlaku', header: 'Hari Berlaku', render: (j) => j.hari_berlaku ?? 'Setiap Hari' },
    aksiKolom<JadwalMaster>(
      (j) => j.cabang_asal,
      (j) =>
        setJadwalForm({
          id: j.id_jadwal,
          data: {
            id_rute: j.id_rute,
            jam_keberangkatan: j.jam_keberangkatan,
            layanan: (j.layanan as LayananKelas) ?? 'Reguler',
            hari_berlaku: j.hari_berlaku ?? 'Setiap Hari',
          },
        }),
      (j) => setHapus({ jenis: 'jadwal', data: j }),
    ),
  ];

  const cabangColumns: Column<CabangMaster>[] = [
    {
      key: 'nama_cabang',
      header: 'Cabang',
      render: (c) => (
        <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
          {c.nama_cabang}
          {c.cabang_saya && <Badge tone="maroon">Cabang Anda</Badge>}
        </span>
      ),
    },
    { key: 'kota', header: 'Kota' },
    { key: 'jumlah_rute', header: 'Rute Berangkat', align: 'right', render: (c) => <span className="tabular-nums">{c.jumlah_rute}</span> },
    { key: 'jumlah_armada', header: 'Armada', align: 'right', render: (c) => <span className="tabular-nums">{c.jumlah_armada}</span> },
  ];

  // ---- jadwal: filter per rute
  const [filterRute, setFilterRute] = useState('');
  const jadwalTampil = useMemo(
    () => (jadwal.data ?? []).filter((j) => !filterRute || j.id_rute === filterRute),
    [jadwal.data, filterRute],
  );

  const aktif = { rute, armada, jadwal, cabang }[tab];
  const labelTab = TABS.find((t) => t.value === tab)!.label;

  const ruteJadwalDipilih = rute.data?.find((r) => r.id_rute === jadwalForm?.data.id_rute);
  const layananJadwal = ruteJadwalDipilih ? pecahLayanan(ruteJadwalDipilih.layanan_tersedia) : LAYANAN;

  const pilihanCabang = cabang.data ?? [];

  return (
    <div>
      <PageHeader
        breadcrumb={['Pengaturan', 'Data Master']}
        title="Data Master"
        subtitle={
          isKepala
            ? `Kelola rute, armada, dan jadwal cabang ${cabangSaya ?? 'Anda'}. Data cabang lain tidak ditampilkan.`
            : 'Kelola rute, armada, jadwal keberangkatan, dan lihat daftar cabang Kencana Travel.'
        }
        actions={
          bisaKelola && tab !== 'cabang' ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={bukaTambah} disabled={tab === 'jadwal' && !rute.data?.length}>
              Tambah {labelTab}
            </Button>
          ) : undefined
        }
      />

      <Card noPadding>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline px-5 py-3">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                tab === t.value ? 'bg-maroon-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {t.icon}
              {t.label}
              <span className={`tabular-nums ${tab === t.value ? 'text-white/70' : 'text-slate-400'}`}>
                {{ rute, armada, jadwal, cabang }[t.value].data?.length ?? ''}
              </span>
            </button>
          ))}
          {tab === 'jadwal' && (
            <select
              value={filterRute}
              onChange={(e) => setFilterRute(e.target.value)}
              className="ml-auto h-8 rounded-lg border border-hairline bg-white px-2 text-xs text-slate-600 focus:border-maroon-400 focus:outline-none"
            >
              <option value="">Semua rute</option>
              {(rute.data ?? []).map((r) => (
                <option key={r.id_rute} value={r.id_rute}>
                  {r.nama_rute}
                </option>
              ))}
            </select>
          )}
          {tab === 'cabang' && <span className="ml-auto text-xs text-slate-400">Daftar cabang hanya dapat dilihat.</span>}
        </div>

        {aktif.error ? (
          <div className="p-5">
            <ErrorState message={aktif.error} onRetry={aktif.reload} />
          </div>
        ) : tab === 'rute' ? (
          <Table columns={ruteColumns} data={rute.data ?? []} keyField={(r) => r.id_rute} loading={rute.loading} emptyMessage="Belum ada rute." />
        ) : tab === 'armada' ? (
          <Table columns={armadaColumns} data={armada.data ?? []} keyField={(a) => a.id_armada} loading={armada.loading} emptyMessage="Belum ada armada." />
        ) : tab === 'jadwal' ? (
          <Table columns={jadwalColumns} data={jadwalTampil} keyField={(j) => j.id_jadwal} loading={jadwal.loading} emptyMessage="Belum ada jadwal." />
        ) : (
          <Table columns={cabangColumns} data={cabang.data ?? []} keyField={(c) => c.id_cabang} loading={cabang.loading} emptyMessage="Belum ada cabang." />
        )}
      </Card>

      {/* ===== MODAL RUTE ===== */}
      <Modal
        open={ruteForm !== null}
        onClose={() => setRuteForm(null)}
        title={ruteForm?.id ? 'Ubah Rute' : 'Tambah Rute'}
        subtitle="Nama rute dibentuk otomatis dengan format Asal->Tujuan"
        footer={
          <>
            <Button variant="outline" onClick={() => setRuteForm(null)}>
              Batal
            </Button>
            <Button type="submit" form="form-rute" loading={menyimpan}>
              Simpan
            </Button>
          </>
        }
      >
        {ruteForm && (
          <form id="form-rute" onSubmit={simpanRute} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Cabang Asal</label>
              <select
                required
                value={ruteForm.data.cabang_asal}
                disabled={isKepala}
                onChange={(e) => {
                  const asal = e.target.value;
                  const tujuan =
                    ruteForm.data.cabang_tujuan !== asal
                      ? ruteForm.data.cabang_tujuan
                      : (pilihanCabang.find((c) => c.nama_cabang !== asal)?.nama_cabang ?? '');
                  setRuteForm({ ...ruteForm, data: { ...ruteForm.data, cabang_asal: asal, cabang_tujuan: tujuan } });
                }}
                className={fieldClass}
              >
                {pilihanCabang.map((c) => (
                  <option key={c.id_cabang} value={c.nama_cabang}>
                    {c.nama_cabang}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cabang Tujuan</label>
              <select
                required
                value={ruteForm.data.cabang_tujuan}
                onChange={(e) => setRuteForm({ ...ruteForm, data: { ...ruteForm.data, cabang_tujuan: e.target.value } })}
                className={fieldClass}
              >
                {pilihanCabang
                  .filter((c) => c.nama_cabang !== ruteForm.data.cabang_asal)
                  .map((c) => (
                    <option key={c.id_cabang} value={c.nama_cabang}>
                      {c.nama_cabang}
                    </option>
                  ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Layanan Tersedia</label>
              <div className="flex gap-4">
                {LAYANAN.map((l) => (
                  <label key={l} className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-maroon-700"
                      checked={ruteForm.data.layanan_tersedia.includes(l)}
                      onChange={(e) => {
                        const set = new Set(ruteForm.data.layanan_tersedia);
                        if (e.target.checked) set.add(l);
                        else set.delete(l);
                        setRuteForm({ ...ruteForm, data: { ...ruteForm.data, layanan_tersedia: LAYANAN.filter((x) => set.has(x)) } });
                      }}
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 sm:col-span-2">
              Nama rute: <span className="font-semibold text-slate-700">{`${ruteForm.data.cabang_asal}->${ruteForm.data.cabang_tujuan}`}</span>
              {ruteForm.id && ' · Asal/tujuan tidak dapat diubah bila rute sudah dipakai transaksi.'}
            </p>
          </form>
        )}
      </Modal>

      {/* ===== MODAL ARMADA ===== */}
      <Modal
        open={armadaForm !== null}
        onClose={() => setArmadaForm(null)}
        title={armadaForm?.id ? 'Ubah Armada' : 'Tambah Armada'}
        subtitle="Kapasitas armada dipakai untuk menghitung okupansi per trip"
        footer={
          <>
            <Button variant="outline" onClick={() => setArmadaForm(null)}>
              Batal
            </Button>
            <Button type="submit" form="form-armada" loading={menyimpan}>
              Simpan
            </Button>
          </>
        }
      >
        {armadaForm && (
          <form id="form-armada" onSubmit={simpanArmada} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Kode Armada</label>
              <input
                required
                maxLength={30}
                placeholder="mis. SOLO-REG-2"
                value={armadaForm.data.kode_armada}
                onChange={(e) => setArmadaForm({ ...armadaForm, data: { ...armadaForm.data, kode_armada: e.target.value.toUpperCase() } })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Jenis Kendaraan</label>
              <input
                required
                maxLength={60}
                placeholder="mis. Toyota HiAce Commuter"
                value={armadaForm.data.jenis_kendaraan}
                onChange={(e) => setArmadaForm({ ...armadaForm, data: { ...armadaForm.data, jenis_kendaraan: e.target.value } })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tipe Layanan</label>
              <select
                value={armadaForm.data.tipe_layanan}
                onChange={(e) => setArmadaForm({ ...armadaForm, data: { ...armadaForm.data, tipe_layanan: e.target.value as LayananKelas } })}
                className={fieldClass}
              >
                {LAYANAN.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Kapasitas (kursi)</label>
              <input
                type="number"
                required
                min={1}
                max={60}
                value={armadaForm.data.kapasitas}
                onChange={(e) => setArmadaForm({ ...armadaForm, data: { ...armadaForm.data, kapasitas: Number(e.target.value) } })}
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Basis Cabang</label>
              <select
                required
                value={armadaForm.data.basis_outlet}
                disabled={isKepala}
                onChange={(e) => setArmadaForm({ ...armadaForm, data: { ...armadaForm.data, basis_outlet: e.target.value } })}
                className={fieldClass}
              >
                {pilihanCabang.map((c) => (
                  <option key={c.id_cabang} value={c.nama_cabang}>
                    {c.nama_cabang}
                  </option>
                ))}
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* ===== MODAL JADWAL ===== */}
      <Modal
        open={jadwalForm !== null}
        onClose={() => setJadwalForm(null)}
        title={jadwalForm?.id ? 'Ubah Jadwal' : 'Tambah Jadwal'}
        subtitle="Satu jadwal = satu kombinasi rute, jam keberangkatan, dan layanan"
        footer={
          <>
            <Button variant="outline" onClick={() => setJadwalForm(null)}>
              Batal
            </Button>
            <Button type="submit" form="form-jadwal" loading={menyimpan} disabled={!jadwalForm?.data.id_rute}>
              Simpan
            </Button>
          </>
        }
      >
        {jadwalForm && (
          <form id="form-jadwal" onSubmit={simpanJadwal} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Rute</label>
              <select
                required
                value={jadwalForm.data.id_rute}
                onChange={(e) => {
                  const r = rute.data?.find((x) => x.id_rute === e.target.value);
                  const tersedia = r ? pecahLayanan(r.layanan_tersedia) : LAYANAN;
                  setJadwalForm({
                    ...jadwalForm,
                    data: {
                      ...jadwalForm.data,
                      id_rute: e.target.value,
                      layanan: tersedia.includes(jadwalForm.data.layanan) ? jadwalForm.data.layanan : tersedia[0],
                    },
                  });
                }}
                className={fieldClass}
              >
                {(rute.data ?? []).map((r) => (
                  <option key={r.id_rute} value={r.id_rute}>
                    {r.nama_rute.replace('->', ' → ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Jam Keberangkatan</label>
              <input
                type="time"
                required
                value={jadwalForm.data.jam_keberangkatan}
                onChange={(e) => setJadwalForm({ ...jadwalForm, data: { ...jadwalForm.data, jam_keberangkatan: e.target.value } })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Layanan</label>
              <select
                value={jadwalForm.data.layanan}
                onChange={(e) => setJadwalForm({ ...jadwalForm, data: { ...jadwalForm.data, layanan: e.target.value as LayananKelas } })}
                className={fieldClass}
              >
                {layananJadwal.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Hari Berlaku</label>
              <select
                value={jadwalForm.data.hari_berlaku}
                onChange={(e) => setJadwalForm({ ...jadwalForm, data: { ...jadwalForm.data, hari_berlaku: e.target.value } })}
                className={fieldClass}
              >
                {[...new Set([...HARI_BERLAKU, jadwalForm.data.hari_berlaku])].map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>
            {jadwalForm.id && (
              <p className="text-xs text-slate-400 sm:col-span-2">
                Bila jadwal sudah dipakai transaksi, hanya hari berlaku yang dapat diubah.
              </p>
            )}
          </form>
        )}
      </Modal>

      {/* ===== KONFIRMASI HAPUS ===== */}
      <Modal
        open={hapus !== null}
        onClose={() => setHapus(null)}
        title={`Hapus ${hapus ? { rute: 'Rute', armada: 'Armada', jadwal: 'Jadwal' }[hapus.jenis] : ''}?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setHapus(null)}>
              Batal
            </Button>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} loading={menyimpan} onClick={konfirmasiHapus}>
              Hapus
            </Button>
          </>
        }
      >
        {hapus && (
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              {hapus.jenis === 'rute' && (
                <>
                  Rute <span className="font-semibold text-slate-900">{hapus.data.nama_rute}</span> beserta{' '}
                  {hapus.data.jumlah_jadwal} jadwalnya akan dihapus permanen.
                </>
              )}
              {hapus.jenis === 'armada' && (
                <>
                  Armada <span className="font-semibold text-slate-900">{hapus.data.kode_armada}</span> ({hapus.data.jenis_kendaraan}) akan
                  dihapus permanen.
                </>
              )}
              {hapus.jenis === 'jadwal' && (
                <>
                  Jadwal{' '}
                  <span className="font-semibold text-slate-900">
                    {hapus.data.nama_rute} · {hapus.data.jam_keberangkatan} {hapus.data.layanan}
                  </span>{' '}
                  akan dihapus permanen.
                </>
              )}
            </p>
            <p className="text-xs text-slate-400">Data yang masih dipakai transaksi tidak dapat dihapus; sistem akan menolaknya.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
