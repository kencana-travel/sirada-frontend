import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Modal from './Modal';
import Button from './Button';
import { createTransaksi } from '../api/transaksi';
import { getJadwalMaster, getRuteMaster } from '../api/master';
import { getErrorMessage } from '../api/client';
import { useAsync } from '../lib/useAsync';
import { useToast } from '../context/ToastContext';
import type { TransaksiCreatePayload } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Nilai mengikuti data di database backend.
const CHANNEL = ['Aplikasi', 'Outlet'];
const MEMBER = ['Non-Member', 'Member Umum', 'Member Mahasiswa'];
const JAM_LAIN = '__lain__';

function hariIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const emptyForm = (): TransaksiCreatePayload => ({
  tanggal: hariIni(),
  jam_keberangkatan: '',
  rute: '',
  layanan: '',
  channel_pemesanan: CHANNEL[1],
  jenis_member: MEMBER[0],
  jumlah_unit: 1,
  nama_pelanggan: '',
});

const fieldClass =
  'h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-slate-800 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

export default function TambahTransaksiModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<TransaksiCreatePayload>(emptyForm);
  const [jamManual, setJamManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const ruteOptions = useAsync(getRuteMaster, []);

  const ruteDipilih = useMemo(
    () => (ruteOptions.data ?? []).find((r) => r.nama_rute === form.rute),
    [ruteOptions.data, form.rute],
  );
  const layananTersedia = useMemo(
    () => (ruteDipilih?.layanan_tersedia ?? '').split(',').map((l) => l.trim()).filter(Boolean),
    [ruteDipilih],
  );
  const jadwal = useAsync(
    () => (ruteDipilih ? getJadwalMaster(ruteDipilih.id_rute) : Promise.resolve([])),
    [ruteDipilih?.id_rute],
  );
  const jamTersedia = useMemo(
    () =>
      (jadwal.data ?? [])
        .filter((j) => j.layanan === form.layanan)
        .map((j) => j.jam_keberangkatan)
        .sort(),
    [jadwal.data, form.layanan],
  );

  // Pilih rute pertama sebagai default begitu daftar rute termuat.
  useEffect(() => {
    if (!form.rute && ruteOptions.data?.length) {
      setForm((prev) => ({ ...prev, rute: ruteOptions.data![0].nama_rute }));
    }
  }, [ruteOptions.data, form.rute]);

  // Layanan harus salah satu yang tersedia di rute terpilih.
  useEffect(() => {
    if (layananTersedia.length && !layananTersedia.includes(form.layanan)) {
      setForm((prev) => ({ ...prev, layanan: layananTersedia[0] }));
    }
  }, [layananTersedia, form.layanan]);

  // Ganti rute/layanan: kembali ke pilihan jam dari jadwal.
  useEffect(() => {
    setJamManual(false);
  }, [ruteDipilih?.id_rute, form.layanan]);

  // Jam default = jadwal pertama untuk rute + layanan; bila tidak ada jadwal, isi manual.
  useEffect(() => {
    if (jadwal.loading) return;
    if (jamTersedia.length === 0) {
      setJamManual(true);
      return;
    }
    if (!jamManual && !jamTersedia.includes(form.jam_keberangkatan)) {
      setForm((prev) => ({ ...prev, jam_keberangkatan: jamTersedia[0] }));
    }
  }, [jamTersedia, jadwal.loading, jamManual, form.jam_keberangkatan]);

  const set = <K extends keyof TransaksiCreatePayload>(key: K, value: TransaksiCreatePayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const tutup = () => {
    if (!saving) onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.jam_keberangkatan)) {
      toast.error('Jam keberangkatan harus berformat HH:MM.');
      return;
    }
    setSaving(true);
    try {
      const hasil = await createTransaksi({ ...form, nama_pelanggan: form.nama_pelanggan?.trim() || undefined });
      toast.success(`Transaksi ${hasil.kode_transaksi} berhasil ditambahkan.`);
      setForm({ ...emptyForm(), rute: form.rute });
      setJamManual(false);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menambahkan transaksi.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={tutup}
      title="Tambah Transaksi"
      subtitle="Catat pemesanan tiket penumpang baru ke dalam sistem"
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={tutup}>
            Batal
          </Button>
          <Button type="submit" form="form-tambah-transaksi" loading={saving} disabled={!form.rute || !form.layanan}>
            Simpan Transaksi
          </Button>
        </>
      }
    >
      <form id="form-tambah-transaksi" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Tanggal</label>
          <input type="date" required value={form.tanggal} onChange={(e) => set('tanggal', e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Rute</label>
          <select
            required
            value={form.rute}
            onChange={(e) => {
              set('rute', e.target.value);
              setJamManual(false);
            }}
            className={fieldClass}
          >
            {ruteOptions.loading && <option value="">Memuat rute...</option>}
            {ruteOptions.error && <option value="">Gagal memuat rute</option>}
            {(ruteOptions.data ?? []).map((r) => (
              <option key={r.id_rute} value={r.nama_rute}>
                {r.nama_rute.replace('->', ' → ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Layanan</label>
          <select
            required
            value={form.layanan}
            onChange={(e) => {
              set('layanan', e.target.value);
              setJamManual(false);
            }}
            className={fieldClass}
          >
            {layananTersedia.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Jam Keberangkatan</label>
          <div className="flex gap-2">
            {jamTersedia.length > 0 && (
              <select
                value={jamManual ? JAM_LAIN : form.jam_keberangkatan}
                onChange={(e) => {
                  if (e.target.value === JAM_LAIN) {
                    setJamManual(true);
                  } else {
                    setJamManual(false);
                    set('jam_keberangkatan', e.target.value);
                  }
                }}
                className={fieldClass}
              >
                {jamTersedia.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
                <option value={JAM_LAIN}>Jam lain…</option>
              </select>
            )}
            {(jamManual || jamTersedia.length === 0) && (
              <input
                type="time"
                required
                value={form.jam_keberangkatan}
                onChange={(e) => set('jam_keberangkatan', e.target.value)}
                className={fieldClass}
              />
            )}
          </div>
          {jamManual && (
            <p className="mt-1 text-[11px] text-slate-400">Jam di luar jadwal akan otomatis ditambahkan sebagai jadwal baru.</p>
          )}
        </div>
        <div>
          <label className={labelClass}>Nama Pelanggan</label>
          <input
            placeholder="Opsional"
            value={form.nama_pelanggan ?? ''}
            onChange={(e) => set('nama_pelanggan', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Channel Pemesanan</label>
          <select
            value={form.channel_pemesanan}
            onChange={(e) => set('channel_pemesanan', e.target.value)}
            className={fieldClass}
          >
            {CHANNEL.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Jenis Member</label>
          <select value={form.jenis_member} onChange={(e) => set('jenis_member', e.target.value)} className={fieldClass}>
            {MEMBER.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Unit (Jumlah Kursi)</label>
          <input
            type="number"
            min={1}
            max={60}
            required
            value={form.jumlah_unit}
            onChange={(e) => set('jumlah_unit', Number(e.target.value))}
            className={fieldClass}
          />
        </div>
        <p className="text-xs text-slate-400 sm:col-span-2">
          Harga tiket diambil dari median harga historis rute dan layanan ini, lalu dikurangi diskon member. Total bayar
          dihitung otomatis oleh sistem.
        </p>
      </form>
    </Modal>
  );
}
