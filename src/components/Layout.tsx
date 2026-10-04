import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { unduhLaporan } from '../api/laporan';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  /** Unduh laporan ringkasan PDF (seluruh periode; Kepala Outlet otomatis dibatasi ke cabangnya). */
  const exportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    toast.info('Menyusun laporan ringkasan PDF. Proses ini bisa memakan waktu hingga beberapa menit.');
    try {
      await unduhLaporan({ jenis: 'ringkasan', format: 'pdf' });
      toast.success('Laporan ringkasan PDF berhasil diunduh.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal membuat laporan PDF.'));
    } finally {
      setExporting(false);
    }
  };

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
          onExportPdf={exportPdf}
          exporting={exporting}
        />

        <main className="mx-auto max-w-[1440px] p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
