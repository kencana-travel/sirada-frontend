import { Calendar, FileDown, Menu, Search, Upload } from 'lucide-react';
import Button from './Button';
import { classNames, initials } from '../lib/format';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  onOpenSidebar: () => void;
  onImportCsv: () => void;
  onExportPdf: () => void;
  search: string;
  onSearch: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}

export default function Topbar({
  onOpenSidebar,
  onImportCsv,
  onExportPdf,
  search,
  onSearch,
  dateRange,
  onDateRangeChange,
}: TopbarProps) {
  const { user, canWrite } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-hairline bg-white/90 px-4 backdrop-blur lg:px-6">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative hidden max-w-xs flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Cari transaksi, rute, pelanggan..."
          className="h-10 w-full rounded-lg border border-hairline bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-maroon-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-100"
        />
      </div>

      {/* Date range picker */}
      <label className="relative hidden items-center md:flex">
        <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="h-10 appearance-none rounded-lg border border-hairline bg-white pl-9 pr-8 text-sm font-medium text-slate-600 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100"
        >
          <option value="7h">7 Hari Terakhir</option>
          <option value="30h">30 Hari Terakhir</option>
          <option value="bulan">Bulan Ini</option>
          <option value="q">Kuartal Ini</option>
          <option value="tahun">Tahun Ini</option>
        </select>
      </label>

      <div className="ml-auto flex items-center gap-2">
        {canWrite && (
          <Button
            variant="outline"
            size="md"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={onImportCsv}
            className="hidden sm:inline-flex"
          >
            Import CSV
          </Button>
        )}
        <Button
          variant="danger"
          size="md"
          leftIcon={<FileDown className="h-4 w-4" />}
          onClick={onExportPdf}
        >
          <span className="hidden sm:inline">Export Laporan PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>

        <div className="ml-1 flex items-center gap-2.5 border-l border-hairline pl-3">
          <div
            className={classNames(
              'grid h-9 w-9 place-items-center rounded-full bg-maroon-700 text-xs font-bold text-white',
            )}
          >
            {initials(user?.nama ?? 'User')}
          </div>
          <div className="hidden leading-tight lg:block">
            <div className="text-sm font-semibold text-slate-800">{user?.nama}</div>
            <div className="text-xs text-slate-400">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
