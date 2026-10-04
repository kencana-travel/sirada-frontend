import { useMemo, useState, type FormEvent } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, Building2, CalendarRange, Info, RotateCcw, Trophy } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Badge, { layananTone, type BadgeTone } from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table, { type Column } from '../components/Table';
import ProgressBar, { okupansiColor } from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { CenterSpinner } from '../components/Spinner';
import { useAsync } from '../lib/useAsync';
import { getPerformaCabang, getPerformaRute, getVipVsReguler } from '../api/performa';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';
import { BRAND } from '../lib/colors';
import { useAuth } from '../context/AuthContext';
import type { PerformaFilter, PerformaRuteItem, StatusOkupansi } from '../types/performa';

/** Kategori okupansi (sama dengan backend): >= 80% Tinggi, 50–80% Sedang, < 50% Rendah. */
const STATUS_TONE: Record<StatusOkupansi, BadgeTone> = { Tinggi: 'green', Sedang: 'amber', Rendah: 'red' };

function statusTone(status?: string): BadgeTone {
  return STATUS_TONE[status as StatusOkupansi] ?? 'slate';
}

function rekomendasi(r: PerformaRuteItem): string {
  if (r.status === 'Rendah') {
    return 'Okupansi di bawah 50%. Kurangi frekuensi jam sepi atau gabungkan jadwal, dan dorong promosi member pada rute ini.';
  }
  if (r.status === 'Sedang') {
    return 'Okupansi cukup. Evaluasi jam keberangkatan dengan muatan rendah dan pertimbangkan promosi di hari kerja.';
  }
  return 'Okupansi tinggi. Pantau jam puncak; bila sering penuh, pertimbangkan tambahan armada atau jadwal.';
}

const KELAS_COLORS: Record<string, string> = { vip: BRAND.maroon, reguler: BRAND.blue };
function kelasColor(kelas: string) {
  return kelas.toLowerCase().includes('vip') ? KELAS_COLORS.vip : KELAS_COLORS.reguler;
}

const dateClass =
  'h-9 rounded-lg border border-hairline bg-white px-2.5 text-sm text-slate-700 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100';

function formatTanggal(iso?: string) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PerformaRute() {
  const { role } = useAuth();
  const [draft, setDraft] = useState<PerformaFilter>({});
  const [filter, setFilter] = useState<PerformaFilter>({});
  const [detail, setDetail] = useState<PerformaRuteItem | null>(null);

  const deps = [filter.tanggal_mulai, filter.tanggal_selesai];
  const performa = useAsync(() => getPerformaRute(filter), deps);
  const cabang = useAsync(() => getPerformaCabang(filter), deps);
  const vip = useAsync(() => getVipVsReguler(filter), deps);

  const rows = performa.data ?? [];
  const rentangSalah = Boolean(draft.tanggal_mulai && draft.tanggal_selesai && draft.tanggal_mulai > draft.tanggal_selesai);
  const adaFilter = Boolean(filter.tanggal_mulai || filter.tanggal_selesai);

  const terapkan = (e: FormEvent) => {
    e.preventDefault();
    if (!rentangSalah) setFilter({ ...draft });
  };
  const reset = () => {
    setDraft({});
    setFilter({});
  };

  const { top, low } = useMemo(() => {
    if (rows.length === 0) return { top: null, low: null };
    const sorted = [...rows].sort((a, b) => b.okupansi_persen - a.okupansi_persen);
    return { top: sorted[0], low: sorted[sorted.length - 1] };
  }, [rows]);

  const totalPendapatan = useMemo(() => rows.reduce((s, r) => s + r.total_pendapatan, 0), [rows]);
  const totalPax = useMemo(() => rows.reduce((s, r) => s + r.total_penumpang, 0), [rows]);

  const periodeLabel = adaFilter
    ? `${formatTanggal(filter.tanggal_mulai) || 'awal data'} – ${formatTanggal(filter.tanggal_selesai) || 'akhir data'}`
    : 'Seluruh periode data';
  const cabangScope = role === 'KepalaOutlet' ? rows[0]?.cabang_asal : undefined;

  const columns: Column<PerformaRuteItem>[] = [
    { key: 'rute', header: 'Nama Rute', render: (r) => <span className="font-semibold text-slate-800">{r.rute}</span> },
    { key: 'total_trip', header: 'Total Trip', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.total_trip)}</span> },
    { key: 'total_penumpang', header: 'Penumpang', align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.total_penumpang)}</span> },
    {
      key: 'rata_penumpang_per_trip',
      header: 'Pnp / Trip',
      align: 'right',
      render: (r) => <span className="tabular-nums">{r.rata_penumpang_per_trip.toFixed(1).replace('.', ',')}</span>,
    },
    {
      key: 'total_pendapatan',
      header: 'Total Pendapatan',
      align: 'right',
      render: (r) => <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(r.total_pendapatan, { compact: true })}</span>,
    },
    {
      key: 'okupansi',
      header: 'Rata-rata Okupansi',
      render: (r) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={r.okupansi_persen} color={okupansiColor(r.okupansi_persen)} height="sm" className="min-w-[80px]" />
          <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-700">{formatPercent(r.okupansi_persen, 0)}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)} dot>{r.status}</Badge> },
    {
      key: 'layanan_dominan',
      header: 'Layanan Dominan',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge tone={layananTone(r.layanan_dominan)}>{r.layanan_dominan}</Badge>
          <span className="text-xs text-slate-400">{formatPercent(r.layanan_dominan_persen, 0)}</span>
        </span>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'center',
      render: (r) => (
        <Button size="sm" variant={r.status === 'Rendah' ? 'danger' : 'outline'} onClick={() => setDetail(r)}>
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        badge={cabangScope ? { label: `Cabang ${cabangScope}`, tone: 'blue', dot: true } : { label: 'Semua Cabang', tone: 'green', dot: true }}
        title="Analisis Performa Rute & Efisiensi Armada"
        subtitle="Bandingkan kontribusi, okupansi per trip, dan efisiensi armada tiap rute dan cabang."
        actions={
          <form onSubmit={terapkan} className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-slate-500">
              <span className="mb-1 block">Dari</span>
              <input
                type="date"
                value={draft.tanggal_mulai ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, tanggal_mulai: e.target.value || undefined }))}
                className={dateClass}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              <span className="mb-1 block">Sampai</span>
              <input
                type="date"
                value={draft.tanggal_selesai ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, tanggal_selesai: e.target.value || undefined }))}
                className={dateClass}
              />
            </label>
            <Button type="submit" size="md" className="!h-9" leftIcon={<CalendarRange className="h-4 w-4" />} disabled={rentangSalah}>
              Terapkan
            </Button>
            {(adaFilter || draft.tanggal_mulai || draft.tanggal_selesai) && (
              <Button type="button" variant="outline" className="!h-9 !px-2.5" onClick={reset} aria-label="Reset filter tanggal" title="Reset filter">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </form>
        }
      />
      {rentangSalah && <p className="-mt-4 mb-4 text-right text-xs text-red-600">Tanggal mulai harus sebelum tanggal selesai.</p>}

      {performa.error ? (
        <Card>
          <ErrorState message={performa.error} onRetry={performa.reload} />
        </Card>
      ) : (
        <>
          {/* ===== ALERT CARDS ===== */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {performa.loading ? (
              <>
                <Card><CenterSpinner /></Card>
                <Card><CenterSpinner /></Card>
              </>
            ) : rows.length === 0 ? (
              <Card className="lg:col-span-2">
                <p className="py-6 text-center text-sm text-slate-400">Tidak ada transaksi penumpang pada periode ini.</p>
              </Card>
            ) : (
              <>
                <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-card">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-600 text-white"><Trophy className="h-5 w-5" /></span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-green-700">Okupansi Tertinggi</div>
                      <div className="text-lg font-bold text-slate-900">{top?.rute ?? '—'}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <AlertStat label="Okupansi" value={formatPercent(top?.okupansi_persen ?? 0, 0)} />
                    <AlertStat label="Kontribusi" value={formatPercent(top?.kontribusi_pendapatan_persen ?? 0, 0)} />
                    <AlertStat label="Penumpang" value={formatNumber(top?.total_penumpang ?? 0)} />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-card">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500 text-white"><AlertTriangle className="h-5 w-5" /></span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Okupansi Terendah</div>
                      <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        {low?.rute ?? '—'}
                        {low && <Badge tone={statusTone(low.status)}>{low.status}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="text-3xl font-extrabold tabular-nums text-amber-600">{formatPercent(low?.okupansi_persen ?? 0, 0)}</div>
                      <div className="text-xs text-slate-500">okupansi rata-rata per trip</div>
                    </div>
                    <div className="flex-1 rounded-lg border border-amber-200 bg-white/70 p-3 text-xs text-slate-600">
                      <span className="font-semibold text-amber-700">Rekomendasi: </span>
                      {low ? rekomendasi(low) : '—'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ===== PERFORMA PER CABANG ===== */}
          <Card
            className="mt-4"
            title="Performa per Cabang"
            subtitle={`Dikelompokkan menurut cabang asal keberangkatan · ${periodeLabel}`}
            icon={<Building2 className="h-4 w-4" />}
          >
            {cabang.loading ? (
              <CenterSpinner />
            ) : cabang.error ? (
              <ErrorState message={cabang.error} onRetry={cabang.reload} compact />
            ) : (cabang.data ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Belum ada data cabang pada periode ini.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(cabang.data ?? []).map((c) => (
                  <div key={c.cabang} className="rounded-lg border border-hairline p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{c.cabang}</div>
                        <div className="text-xs text-slate-400">{c.jumlah_rute} rute · layanan dominan {c.layanan_dominan}</div>
                      </div>
                      <Badge tone={statusTone(c.status)} dot>{c.status}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <ProgressBar value={c.okupansi_persen} color={okupansiColor(c.okupansi_persen)} />
                      <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-700">{formatPercent(c.okupansi_persen, 0)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <MiniStat label="Trip" value={formatNumber(c.total_trip)} />
                      <MiniStat label="Penumpang" value={formatNumber(c.total_penumpang)} />
                      <MiniStat label="Pendapatan" value={formatCurrency(c.total_pendapatan, { compact: true })} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ===== DISTRIBUSI + VIP VS REGULER ===== */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Distribusi Pendapatan Rute" subtitle="Kontribusi tiap rute terhadap total pendapatan">
              {performa.loading ? (
                <CenterSpinner />
              ) : (
                <>
                  <ul className="space-y-4">
                    {rows.map((r) => (
                      <li key={r.rute}>
                        <div className="mb-1.5 flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700">{r.rute}</span>
                          <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                          <span className="ml-auto text-xs text-slate-400">
                            {formatNumber(r.total_penumpang)} pax · {formatCurrency(r.total_pendapatan, { compact: true })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={r.kontribusi_pendapatan_persen} color="maroon" />
                          <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-600">
                            {formatPercent(r.kontribusi_pendapatan_persen, 0)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-sm">
                    <span className="font-semibold text-slate-500">Total Kumulatif</span>
                    <span className="font-bold tabular-nums text-slate-900">
                      {formatNumber(totalPax)} pax · {formatCurrency(totalPendapatan, { compact: true })}
                    </span>
                  </div>
                </>
              )}
            </Card>

            <Card title="Perbandingan Layanan VIP vs Reguler" subtitle="Kontribusi pendapatan & harga per kelas">
              {vip.loading ? (
                <CenterSpinner />
              ) : vip.error ? (
                <ErrorState message={vip.error} onRetry={vip.reload} compact />
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-5">
                    <div className="h-36 w-36 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={vip.data?.kelas ?? []} dataKey="kontribusi_persen" nameKey="kelas" innerRadius={44} outerRadius={66} paddingAngle={2} stroke="none">
                            {(vip.data?.kelas ?? []).map((k) => (
                              <Cell key={k.kelas} fill={kelasColor(k.kelas)} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatPercent(v, 0)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="flex-1 space-y-2 text-sm">
                      {(vip.data?.kelas ?? []).map((k) => (
                        <li key={k.kelas} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: kelasColor(k.kelas) }} />
                            {k.kelas}
                          </span>
                          <span className="font-semibold tabular-nums text-slate-800">{formatPercent(k.kontribusi_persen, 0)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-hairline">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2 text-left font-semibold">Kelas</th>
                          <th className="px-3 py-2 text-right font-semibold">Share Transaksi</th>
                          <th className="px-3 py-2 text-right font-semibold">Rata-rata Harga</th>
                          <th className="px-3 py-2 text-right font-semibold">Pendapatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(vip.data?.kelas ?? []).map((k) => (
                          <tr key={k.kelas} className="border-t border-hairline">
                            <td className="px-3 py-2 font-medium text-slate-700">{k.kelas}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatPercent(k.share_transaksi_persen ?? 0, 0)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-700">{formatCurrency(k.rata_rata_harga)}</td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                              {formatCurrency(k.total_pendapatan ?? 0, { compact: true })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ===== TABEL DETAIL ===== */}
          <Card
            className="mt-4"
            title={rows.length ? `Detail Performa ${rows.length} Rute` : 'Detail Performa Rute'}
            subtitle={`${periodeLabel} · status: ≥ 80% Tinggi, 50–80% Sedang, < 50% Rendah`}
            noPadding
          >
            <Table
              columns={columns}
              data={rows}
              keyField={(r) => r.rute}
              loading={performa.loading}
              emptyMessage="Belum ada data performa rute."
            />
          </Card>
        </>
      )}

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `Performa ${detail.rute}` : undefined}
        subtitle={detail ? `${detail.cabang_asal ?? '-'} → ${detail.cabang_tujuan ?? '-'} · ${periodeLabel}` : undefined}
        footer={
          <Button variant="outline" onClick={() => setDetail(null)}>
            Tutup
          </Button>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-extrabold tabular-nums text-slate-900">{formatPercent(detail.okupansi_persen, 1)}</div>
              <Badge tone={statusTone(detail.status)} dot size="md">
                Okupansi {detail.status}
              </Badge>
            </div>
            <ProgressBar value={detail.okupansi_persen} color={okupansiColor(detail.okupansi_persen)} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniStat label="Total Trip" value={formatNumber(detail.total_trip)} />
              <MiniStat label="Transaksi" value={formatNumber(detail.total_transaksi)} />
              <MiniStat label="Penumpang" value={formatNumber(detail.total_penumpang)} />
              <MiniStat label="Kapasitas Tersedia" value={formatNumber(detail.kapasitas_tersedia)} />
              <MiniStat label="Penumpang / Trip" value={detail.rata_penumpang_per_trip.toFixed(1).replace('.', ',')} />
              <MiniStat label="Pendapatan" value={formatCurrency(detail.total_pendapatan, { compact: true })} />
              <MiniStat label="Kontribusi" value={formatPercent(detail.kontribusi_pendapatan_persen, 1)} />
              <MiniStat
                label="Layanan Dominan"
                value={`${detail.layanan_dominan} (${formatPercent(detail.layanan_dominan_persen, 0)})`}
              />
            </div>
            <div className="rounded-lg border border-hairline bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Rekomendasi: </span>
              {rekomendasi(detail)}
            </div>
            <p className="flex items-start gap-1.5 text-[11px] text-slate-400">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Okupansi = rata-rata (penumpang per trip ÷ kapasitas armada trip tersebut). Trip = kombinasi unik tanggal, jam
              keberangkatan, dan layanan.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AlertStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-2.5 text-center ring-1 ring-inset ring-black/5">
      <div className="text-base font-bold tabular-nums text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <div className="text-sm font-bold tabular-nums text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
