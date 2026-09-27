import { NavLink } from 'react-router-dom';
import {
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Route,
  ReceiptText,
  TrendingUp,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import Logo from './Logo';
import { classNames } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/data-transaksi', label: 'Data Transaksi', icon: ReceiptText },
  { to: '/segmentasi', label: 'Segmentasi', icon: Users },
  { to: '/forecasting', label: 'Forecasting', icon: TrendingUp },
  { to: '/performa-rute', label: 'Performa Rute', icon: Route },
];

const adminNavItems = [{ to: '/kelola-pengguna', label: 'Kelola Pengguna', icon: UserCog }];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onLaporan: () => void;
}

export default function Sidebar({ open, onClose, onLaporan }: SidebarProps) {
  const { user, role, signOut } = useAuth();
  const menu = [
    { judul: 'Menu Utama', items: navItems },
    ...(role === 'Admin' ? [{ judul: 'Pengaturan', items: adminNavItems }] : []),
  ];

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-maroon-800 to-maroon-950 transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo variant="light" />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {menu.map(({ judul, items }, i) => (
            <div key={judul} className={i > 0 ? 'pt-4' : undefined}>
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {judul}
              </p>
              <div className="space-y-1">
                {items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      classNames(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-white/70 hover:bg-white/10 hover:text-white',
                      )
                    }
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bagian bawah — dipisah garis */}
        <div className="mt-auto space-y-1 border-t border-white/10 px-3 py-3">
          <button
            onClick={onLaporan}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <FileBarChart2 className="h-[18px] w-[18px]" />
            Laporan
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-red-500/20 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>

          <div className="mt-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xs font-bold text-white">
              {(user?.nama ?? 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-xs font-semibold text-white">{user?.nama}</div>
              <div className="truncate text-[10px] text-white/50">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
