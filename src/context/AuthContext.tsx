import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { CurrentUser, LoginResponse, UserRole } from '../types';
import {
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  UNAUTHORIZED_EVENT,
} from '../lib/storage';

interface AuthContextValue {
  user: CurrentUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  /** Hanya Admin yang boleh melakukan aksi tulis (tambah transaksi, jalankan model AI, import). */
  canWrite: boolean;
  signIn: (res: LoginResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function deriveUser(res: LoginResponse): CurrentUser {
  const emailLocal = res.email?.split('@')[0] ?? '';
  const fallbackName = emailLocal
    ? emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1)
    : res.role;
  return {
    nama: res.nama || fallbackName,
    email: res.email || '',
    role: res.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(() =>
    getToken() ? getStoredUser() : null,
  );

  const signIn = useCallback((res: LoginResponse) => {
    setToken(res.access_token);
    const nextUser = deriveUser(res);
    setStoredUser(nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    clearAuth();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // Redirect otomatis ke login saat interceptor menangkap 401.
  useEffect(() => {
    const handler = () => {
      clearAuth();
      setUser(null);
      navigate('/login', { replace: true });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      canWrite: user?.role === 'Admin',
      signIn,
      signOut,
    }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
