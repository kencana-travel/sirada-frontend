import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useToast } from '../context/ToastContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('30h');
  const toast = useToast();

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLaporan={() => toast.info('Menyiapkan berkas laporan untuk diunduh...')}
      />

      <div className="lg:pl-64">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onImportCsv={() => toast.info('Pilih berkas CSV untuk diimpor (demo).')}
          onExportPdf={() => toast.success('Laporan PDF sedang dibuat, mohon tunggu...')}
          search={search}
          onSearch={setSearch}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <main className="mx-auto max-w-[1440px] p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
