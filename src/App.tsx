import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute, { AdminRoute, RoleRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Daftar from './pages/Daftar';
import VerifikasiEmail from './pages/VerifikasiEmail';
import LupaPassword from './pages/LupaPassword';
import ResetPassword from './pages/ResetPassword';
import KelolaPengguna from './pages/KelolaPengguna';
import Dashboard from './pages/Dashboard';
import DataTransaksi from './pages/DataTransaksi';
import Segmentasi from './pages/Segmentasi';
import Forecasting from './pages/Forecasting';
import PerformaRute from './pages/PerformaRute';
import EksplorasiData from './pages/EksplorasiData';
import DataMaster from './pages/DataMaster';
import ImportData from './pages/ImportData';
import Laporan from './pages/Laporan';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/daftar"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Daftar />}
      />
      <Route path="/lupa-password" element={<LupaPassword />} />
      {/* Dibuka dari link di email — tetap bisa diakses walau sedang login. */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verifikasi-email" element={<VerifikasiEmail />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/data-transaksi" element={<DataTransaksi />} />
        <Route path="/segmentasi" element={<Segmentasi />} />
        <Route path="/forecasting" element={<Forecasting />} />
        <Route path="/performa-rute" element={<PerformaRute />} />
        <Route path="/eksplorasi-data" element={<EksplorasiData />} />
        <Route path="/laporan" element={<Laporan />} />
        <Route
          path="/data-master"
          element={
            <RoleRoute roles={['Admin', 'KepalaOutlet']}>
              <DataMaster />
            </RoleRoute>
          }
        />
        <Route
          path="/import-data"
          element={
            <AdminRoute>
              <ImportData />
            </AdminRoute>
          }
        />
        <Route
          path="/kelola-pengguna"
          element={
            <AdminRoute>
              <KelolaPengguna />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
