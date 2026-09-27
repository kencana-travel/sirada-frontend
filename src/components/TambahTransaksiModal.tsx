import { useEffect, useState, type FormEvent } from 'react';
import Modal from './Modal';
import Button from './Button';
import { createTransaksi } from '../api/transaksi';
import { getRuteTersedia } from '../api/forecasting';
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
const LAYANAN = ['VIP', 'Reguler'];
const CHANNEL = ['Aplikasi', 'Outlet'];
const MEMBER = ['Member Mahasiswa', 'Member Umum', 'Non-Member'];

const emptyForm: TransaksiCreatePayload = {
  tanggal: new Date().toISOString().slice(0, 10),
  jam_keberangkatan: '08:00',
  rute: '',
  layanan: LAYANAN[0],
  channel_pemesanan: CHANNEL[0],
  jenis_member: MEMBER[0],
  jumlah_unit: 1,
  nama_pelanggan: '',
};

const fieldClass =
  'h-10 w-full rounded-lg border border-hairline bg-white px-3 text-sm text-slate-800 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

export default function TambahTransaksiModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<TransaksiCreatePayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const ruteOptions = useAsync(getRuteTersedia, []);

  // Pilih rute pertama sebagai default begitu daftar rute termuat.
  useEffect(() => {
    if (!form.rute && ruteOptions.data?.length) {
      setForm((prev) => ({ ...prev, rute: ruteOptions.data![0] }));
    }
  }, [ruteOptions.data, form.rute]);

  const set = <K extends keyof TransaksiCreatePayload>(key: K, value: TransaksiCreatePayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createTransaksi({ ...form, nama_pelanggan: form.nama_pelanggan?.trim() || undefined });
      toast.success('Transaksi baru berhasil ditambahkan.');
      setForm({ ...emptyForm, rute: ruteOptions.data?.[0] ?? '' });
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
      onClose={onClose}
      title="Tambah Transaksi"
      subtitle="Catat pemesanan tiket baru ke dalam sistem"
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="form-tambah-transaksi" loading={saving}>
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
          <label className={labelClass}>Jam Keberangkatan</label>
          <input
            type="time"
            required
            value={form.jam_keberangkatan}
            onChange={(e) => set('jam_keberangkatan', e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>Rute</label>
          <select required value={form.rute} onChange={(e) => set('rute', e.target.value)} className={fieldClass}>
            {ruteOptions.loading && <option value="">Memuat rute...</option>}
            {(ruteOptions.data ?? []).map((r) => (
              <option key={r} value={r}>
                {r.replace('->', ' → ')}
              </option>
            ))}
          </select>
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
          <label className={labelClass}>Layanan</label>
          <select value={form.layanan} onChange={(e) => set('layanan', e.target.value)} className={fieldClass}>
            {LAYANAN.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
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
            required
            value={form.jumlah_unit}
            onChange={(e) => set('jumlah_unit', Number(e.target.value))}
            className={fieldClass}
          />
        </div>
        <p className="text-xs text-slate-400 sm:col-span-2">
          Total bayar dihitung otomatis oleh sistem berdasarkan tarif dan diskon member.
        </p>
      </form>
    </Modal>
  );
}
