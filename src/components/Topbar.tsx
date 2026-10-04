import { FileDown, Menu, Upload } from 'lucide-react';
import Button from './Button';
import { classNames, initials } from '../lib/format';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  onOpenSidebar: () => void;
  onImportCsv: () => void;
  onExportPdf: () => void;
  /** true selama laporan PDF sedang disusun/diunduh. */
  exporting?: boolean;
}

export default function Topbar({
  onOpenSidebar,
  onImportCsv,
  onExportPdf,
  exporting = false,
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
          loading={exporting}
          title="Unduh laporan ringkasan (PDF) dari data terbaru"
        >
          <span className="hidden sm:inline">{exporting ? 'Menyusun PDF...' : 'Export Laporan PDF'}</span>
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
