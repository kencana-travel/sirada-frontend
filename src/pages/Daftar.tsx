import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, MailCheck, User } from 'lucide-react';
import AuthShell, { AuthAlert, AuthField } from '../components/AuthShell';
import Button from '../components/Button';
import { kirimUlangVerifikasi, register } from '../api/auth';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

const MIN_PASSWORD = 8;

export default function Daftar() {
  const toast = useToast();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terkirimKe, setTerkirimKe] = useState<string | null>(null);
  const [mengirimUlang, setMengirimUlang] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(`Kata sandi minimal ${MIN_PASSWORD} karakter.`);
    if (password !== konfirmasi) return setError('Konfirmasi kata sandi tidak sama.');

    setLoading(true);
    try {
      await register({ nama: nama.trim(), email: email.trim(), password });
      setTerkirimKe(email.trim());
    } catch (err) {
      setError(getErrorMessage(err, 'Pendaftaran gagal. Coba lagi.'));
    } finally {
      setLoading(false);
    }
  };

  const kirimUlang = async () => {
    if (!terkirimKe) return;
    setMengirimUlang(true);
    try {
      const res = await kirimUlangVerifikasi(terkirimKe);
      toast.success(res.pesan);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMengirimUlang(false);
    }
  };

  if (terkirimKe) {
    return (
      <AuthShell title="Cek email Anda" subtitle="Satu langkah lagi untuk menyelesaikan pendaftaran.">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-maroon-50 text-maroon-700">
            <MailCheck className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Kami telah mengirim link verifikasi ke <span className="font-semibold text-slate-900">{terkirimKe}</span>.
            Klik link tersebut untuk memverifikasi email Anda.
          </p>
          <div className="mt-5 w-full">
            <AuthAlert tone="info">
              Setelah email terverifikasi, akun Anda akan ditinjau Admin. Anda akan menerima email lagi saat akun
              sudah disetujui.
            </AuthAlert>
          </div>
          <p className="mt-5 text-xs text-slate-400">Tidak menerima email? Periksa folder spam, atau</p>
          <Button variant="outline" size="sm" className="mt-2" loading={mengirimUlang} onClick={kirimUlang}>
            Kirim ulang link verifikasi
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Daftar Akun"
      subtitle="Buat akun untuk mengakses SIRADA Kencana. Akun baru perlu verifikasi email dan persetujuan Admin."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="nama"
          label="Nama Lengkap"
          icon={<User className="h-4 w-4" />}
          required
          minLength={2}
          autoComplete="name"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama lengkap Anda"
        />
        <AuthField
          id="email"
          type="email"
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@kencanatravel.co.id"
        />
        <AuthField
          id="password"
          type="password"
          label="Kata Sandi"
          icon={<Lock className="h-4 w-4" />}
          required
          minLength={MIN_PASSWORD}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`Minimal ${MIN_PASSWORD} karakter.`}
        />
        <AuthField
          id="konfirmasi"
          type="password"
          label="Konfirmasi Kata Sandi"
          icon={<Lock className="h-4 w-4" />}
          required
          autoComplete="new-password"
          value={konfirmasi}
          onChange={(e) => setKonfirmasi(e.target.value)}
        />

        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Daftar
        </Button>
        <p className="text-center text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-maroon-700 hover:text-maroon-800">
            Masuk
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
