import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/** Halaman khusus Admin; role lain diarahkan kembali ke dashboard. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  if (role !== 'Admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
