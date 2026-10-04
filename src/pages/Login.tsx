import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bus,
  Eye,
  EyeOff,
  Headset,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { kirimUlangVerifikasi, login } from '../api/auth';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const floatingCards = [
  { icon: TrendingUp, title: 'Forecasting Demand', desc: 'Perbandingan ARIMA, SARIMA, SARIMAX & Holt-Winters', badge: 'MAPE terkecil', tone: 'emerald' },
  { icon: MapPin, title: 'Performa Rute & Cabang', desc: 'Okupansi, penumpang & pendapatan per rute', badge: '6 Rute', tone: 'sky' },
  { icon: Users, title: 'Segmentasi Pelanggan', desc: 'RFM + K-Means dengan evaluasi Silhouette & DBI', badge: 'RFM', tone: 'amber' },
];

const badgeTone: Record<string, string> = {
  emerald: 'bg-emerald-400/20 text-emerald-100 ring-emerald-300/30',
  sky: 'bg-sky-400/20 text-sky-100 ring-sky-300/30',
  amber: 'bg-amber-400/20 text-amber-100 ring-amber-300/30',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mengirimUlang, setMengirimUlang] = useState(false);
  const belumVerifikasi = error?.toLowerCase().includes('belum diverifikasi') ?? false;

  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      signIn(res);
      toast.success('Berhasil masuk. Selamat datang kembali!');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err, 'Email atau kata sandi salah.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const kirimUlang = async () => {
    setMengirimUlang(true);
    try {
      const res = await kirimUlangVerifikasi(email.trim());
      toast.success(res.pesan);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMengirimUlang(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ============== KIRI: FORM ============== */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Logo size="lg" />

          <div className="mt-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-maroon-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-maroon-700 ring-1 ring-inset ring-maroon-600/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Portal Internal Resmi
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
              Selamat Datang Kembali
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Masuk untuk mengakses dashboard analitik rute &amp; demand Kencana Travel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email Perusahaan
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@kencanatravel.co.id"
                  className="h-11 w-full rounded-lg border border-hairline bg-white pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-hairline bg-white pl-10 pr-11 text-sm text-slate-800 placeholder:text-slate-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-maroon-700 focus:ring-maroon-500"
                />
                Ingat Saya
              </label>
              <Link to="/lupa-password" className="text-sm font-semibold text-maroon-700 hover:text-maroon-800">
                Lupa Kata Sandi?
              </Link>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
                {belumVerifikasi && (
                  <button
                    type="button"
                    onClick={kirimUlang}
                    disabled={mengirimUlang}
                    className="mt-1 block font-semibold underline hover:text-red-800 disabled:opacity-60"
                  >
                    {mengirimUlang ? 'Mengirim...' : 'Kirim ulang link verifikasi'}
                  </button>
                )}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Masuk ke Dashboard
            </Button>

            <p className="text-center text-sm text-slate-500">
              Belum punya akun?{' '}
              <Link to="/daftar" className="font-semibold text-maroon-700 hover:text-maroon-800">
                Daftar
              </Link>
            </p>

            <Button
              type="button"
              variant="outline"
              fullWidth
              size="lg"
              leftIcon={<Headset className="h-4 w-4" />}
              onClick={() => toast.info('Hubungi tim IT di ext. 101 atau it@kencanatravel.co.id')}
            >
              Bantuan IT
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Kencana Travel — SIRADA Kencana v1.0. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>

      {/* ============== KANAN: PANEL BRANDING ============== */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-maroon-700 via-maroon-800 to-maroon-950 lg:block">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-maroon-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-maroon-400/10 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
              Sistem Informasi Rute dan Demand Analitik
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-8">
            {/* Ilustrasi bus */}
            <div className="relative mb-10 grid h-36 w-36 place-items-center rounded-[2rem] bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <Bus className="h-20 w-20 text-white" strokeWidth={1.4} />
              <span className="absolute -bottom-3 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-maroon-800 shadow-lg">
                KENCANA TRAVEL
              </span>
            </div>

            <div className="w-full max-w-sm space-y-3">
              {floatingCards.map(({ icon: Icon, title, desc, badge, tone }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5 ring-1 ring-inset ring-white/15 backdrop-blur transition-transform hover:translate-x-1"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="truncate text-xs text-white/60">{desc}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${badgeTone[tone]}`}>
                    {badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <blockquote className="border-l-2 border-white/30 pl-4">
            <p className="text-sm italic leading-relaxed text-white/80">
              &ldquo;Data yang tepat mengubah setiap keberangkatan menjadi keputusan yang cerdas.&rdquo;
            </p>
            <footer className="mt-2 text-xs font-medium text-white/50">— Tim Analitik SIRADA Kencana</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
