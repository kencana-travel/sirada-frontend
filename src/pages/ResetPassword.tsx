import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import AuthShell, { AuthAlert, AuthField } from '../components/AuthShell';
import Button from '../components/Button';
import { resetPassword } from '../api/auth';
import { getErrorMessage } from '../api/client';

const MIN_PASSWORD = 8;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [berhasil, setBerhasil] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(`Kata sandi minimal ${MIN_PASSWORD} karakter.`);
    if (password !== konfirmasi) return setError('Konfirmasi kata sandi tidak sama.');

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setBerhasil(res.pesan);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mengubah kata sandi.'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Reset Kata Sandi">
        <AuthAlert tone="error">
          Link reset tidak lengkap. Buka link langsung dari email Anda, atau{' '}
          <Link to="/lupa-password" className="font-semibold underline">
            minta link baru
          </Link>
          .
        </AuthAlert>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Buat Kata Sandi Baru" subtitle="Masukkan kata sandi baru untuk akun Anda.">
      {berhasil ? (
        <div className="space-y-4">
          <AuthAlert tone="success">{berhasil}</AuthAlert>
          <Button fullWidth size="lg" onClick={() => navigate('/login')}>
            Masuk
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            id="password"
            type="password"
            label="Kata Sandi Baru"
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
          {error && (
            <AuthAlert tone="error">
              {error}{' '}
              {error.includes('kedaluwarsa') && (
                <Link to="/lupa-password" className="font-semibold underline">
                  Minta link baru
                </Link>
              )}
            </AuthAlert>
          )}
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Simpan Kata Sandi
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
