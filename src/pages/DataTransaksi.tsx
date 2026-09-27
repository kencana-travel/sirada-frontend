import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Globe,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  Store,
  Upload,
  User,
  Wallet,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge, { layananTone, memberTone } from '../components/Badge';
import Button from '../components/Button';
import Table, { type Column } from '../components/Table';
import Pagination from '../components/Pagination';
import ErrorState from '../components/ErrorState';
import TambahTransaksiModal from '../components/TambahTransaksiModal';
import { useAsync } from '../lib/useAsync';
import { useDebounce } from '../lib/useDebounce';
import { getTransaksi } from '../api/transaksi';
import { getRuteTersedia } from '../api/forecasting';
import { formatCurrency, formatNumber } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Transaksi } from '../types';

// Nilai harus sama persis dengan kolom di database backend (filter pakai "==").
const LAYANAN = ['VIP', 'Reguler'];
const CHANNEL = ['Aplikasi', 'Outlet'];
const PER_HALAMAN = 10;

function ChannelCell({ channel }: { channel: string }) {
  const v = channel.toLowerCase();
  const Icon = v.includes('aplikasi') ? Smartphone : v.includes('web') ? Globe : v.includes('agen') || v.includes('outlet') ? Store : User;
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-600">
      <Icon className="h-4 w-4 text-slate-400" />
      {channel}
    </span>
  );
}

const selectClass =
  'h-10 rounded-lg border border-hairline bg-white px-3 text-sm text-slate-600 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100';

export default function DataTransaksi() {
  const { canWrite } = useAuth();
  const toast = useToast();

  const [searchInput, setSearchInput] = useState('');
  const cari = useDebounce(searchInput, 400);
  const [rute, setRute] = useState('');
  const [layanan, setLayanan] = useState('');
  const [channel, setChannel] = useState('');
  const [halaman, setHalaman] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  // Reset ke halaman 1 setiap kali filter berubah.
  useEffect(() => {
    setHalaman(1);
  }, [cari, rute, layanan, channel]);

  const query = useMemo(
    () => ({ cari, rute, layanan, channel, halaman, per_halaman: PER_HALAMAN }),
    [cari, rute, layanan, channel, halaman],
  );

  const { data, loading, error, reload } = useAsync(() => getTransaksi(query), [
    cari,
    rute,
    layanan,
    channel,
    halaman,
  ]);

  const ruteOptions = useAsync(getRuteTersedia, []);

  const columns: Column<Transaksi>[] = [
    {
      key: 'kode_transaksi',
      header: 'Kode Transaksi',
      render: (r) => <span className="font-semibold text-slate-900">{r.kode_transaksi}</span>,
    },
    { key: 'tanggal', header: 'Tanggal', render: (r) => <span className="tabular-nums">{r.tanggal}</span> },
    { key: 'jam', header: 'Jam', render: (r) => <span className="tabular-nums text-slate-500">{r.jam}</span> },
    {
      key: 'rute',
      header: 'Rute Armada',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
          {r.rute_asal}
          <ArrowRight className="h-3.5 w-3.5 text-maroon-500" />
          {r.rute_tujuan}
        </span>
      ),
    },
    {
      key: 'layanan',
      header: 'Layanan',
      render: (r) => <Badge tone={layananTone(r.layanan)}>{r.layanan}</Badge>,
    },
    { key: 'channel', header: 'Channel', render: (r) => <ChannelCell channel={r.channel} /> },
    {
      key: 'jenis_member',
      header: 'Jenis Member',
      render: (r) => <Badge tone={memberTone(r.jenis_member)}>{r.jenis_member}</Badge>,
    },
    {
      key: 'unit',
      header: 'Unit',
      align: 'center',
      render: (r) => (
        <span className="font-semibold tabular-nums text-slate-800">
          {formatNumber(r.unit)}
          {r.satuan && r.satuan !== 'Orang' && <span className="ml-1 text-xs font-normal text-slate-400">{r.satuan}</span>}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        badge={{ label: 'Operational Hub', tone: 'maroon', dot: true }}
        title="Data Transaksi Pemesanan Tiket"
        subtitle="Kelola dan telusuri seluruh transaksi pemesanan armada shuttle."
        actions={
          <>
            <Card className="!shadow-none" bodyClassName="!p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <CalendarCheck className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <div className="text-[11px] text-slate-400">Total Hari Ini</div>
                  <div className="text-lg font-bold tabular-nums text-slate-900">
                    {formatNumber(data?.total_hari_ini ?? 0)}
                  </div>
                </div>
              </div>
            </Card>
            <Card className="!shadow-none" bodyClassName="!p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-50 text-green-600">
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <div className="text-[11px] text-slate-400">Omset Terverifikasi</div>
                  <div className="text-lg font-bold tabular-nums text-slate-900">
                    {formatCurrency(data?.omset_terverifikasi ?? 0, { compact: true })}
                  </div>
                </div>
              </div>
            </Card>
          </>
        }
      />

      <Card noPadding>
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-hairline p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari Kode Transaksi, Nama..."
              className="h-10 w-full rounded-lg border border-hairline bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-maroon-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-100"
            />
          </div>

          <select value={rute} onChange={(e) => setRute(e.target.value)} className={selectClass}>
            <option value="">Semua Rute</option>
            {(ruteOptions.data ?? []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select value={layanan} onChange={(e) => setLayanan(e.target.value)} className={selectClass}>
            <option value="">Semua Layanan</option>
            {LAYANAN.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={selectClass}>
            <option value="">Semua Channel</option>
            {CHANNEL.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <Button variant="outline" size="md" onClick={reload} aria-label="Muat ulang" className="!px-2.5">
            <RefreshCw className="h-4 w-4" />
          </Button>

          {canWrite && (
            <>
              <Button
                variant="outline"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => toast.info('Pilih berkas CSV untuk diimpor (demo).')}
              >
                Import CSV
              </Button>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
                Tambah Transaksi
              </Button>
            </>
          )}
        </div>

        {error ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={data?.data ?? []}
              keyField={(r) => r.kode_transaksi}
              loading={loading}
              skeletonRows={PER_HALAMAN}
              emptyMessage="Tidak ada transaksi yang cocok dengan filter."
            />
            <Pagination
              page={data?.halaman ?? halaman}
              perPage={data?.per_halaman ?? PER_HALAMAN}
              total={data?.total ?? 0}
              onPageChange={setHalaman}
            />
          </>
        )}
      </Card>

      {canWrite && (
        <TambahTransaksiModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={reload} />
      )}
    </div>
  );
}
