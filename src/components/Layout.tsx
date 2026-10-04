import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('30h');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64">
        <Topbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onImportCsv={() => navigate('/import-data')}
          onExportPdf={() => navigate('/laporan')}
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
