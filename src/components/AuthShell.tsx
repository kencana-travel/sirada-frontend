import type { InputHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from './Logo';

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Tampilkan tautan "Kembali ke halaman masuk" di bawah kartu. */
  backToLogin?: boolean;
}

/** Kerangka halaman publik (daftar, lupa/reset password, verifikasi email). */
export default function AuthShell({ title, subtitle, children, backToLogin = true }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <Logo size="lg" className="mb-8 justify-center" />
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {backToLogin && (
          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-maroon-700 hover:text-maroon-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke halaman masuk
          </Link>
        )}
      </div>
    </div>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  hint?: string;
}

/** Input berlabel dengan ikon, seragam dengan form di halaman Login. */
export function AuthField({ label, icon, hint, id, className, ...props }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        )}
        <input
          id={id}
          {...props}
          className={`h-11 w-full rounded-lg border border-hairline bg-white ${icon ? 'pl-10' : 'pl-3'} pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100 ${className ?? ''}`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Kotak pesan sukses / error di dalam kartu auth. */
export function AuthAlert({ tone, children }: { tone: 'success' | 'error' | 'info'; children: ReactNode }) {
  const cls =
    tone === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : tone === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-blue-200 bg-blue-50 text-blue-800';
  return <div className={`rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed ${cls}`}>{children}</div>;
}
