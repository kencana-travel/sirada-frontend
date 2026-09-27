import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import AuthShell, { AuthAlert, AuthField } from '../components/AuthShell';
import Button from '../components/Button';
import { lupaPassword } from '../api/auth';
import { getErrorMessage } from '../api/client';

export default function LupaPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await lupaPassword(email.trim());
      setPesan(res.pesan);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Lupa Kata Sandi"
      subtitle="Masukkan email akun Anda. Kami akan mengirim link untuk membuat kata sandi baru."
    >
      {pesan ? (
        <div className="space-y-4">
          <AuthAlert tone="success">{pesan}</AuthAlert>
          <p className="text-sm text-slate-500">
            Link berlaku 30 menit. Tidak menerima email? Periksa folder spam atau kirim ulang.
          </p>
          <Button variant="outline" fullWidth onClick={() => setPesan(null)}>
            Kirim ulang
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Kirim Link Reset
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
