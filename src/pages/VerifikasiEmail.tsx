import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleCheck, CircleX } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { CenterSpinner } from '../components/Spinner';
import { verifikasiEmail } from '../api/auth';
import { getErrorMessage } from '../api/client';

type State = { status: 'loading' } | { status: 'ok'; pesan: string } | { status: 'error'; pesan: string };

export default function VerifikasiEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>({ status: 'loading' });
  // Token sekali pakai: cegah pemanggilan ganda oleh StrictMode (dev).
  const sudahDipanggil = useRef(false);

  useEffect(() => {
    if (sudahDipanggil.current) return;
    sudahDipanggil.current = true;
    if (!token) {
      setState({ status: 'error', pesan: 'Link verifikasi tidak lengkap. Buka link langsung dari email Anda.' });
      return;
    }
    verifikasiEmail(token)
      .then((res) => setState({ status: 'ok', pesan: res.pesan }))
      .catch((err) => setState({ status: 'error', pesan: getErrorMessage(err, 'Verifikasi gagal.') }));
  }, [token]);

  return (
    <AuthShell title="Verifikasi Email">
      {state.status === 'loading' ? (
        <CenterSpinner label="Memverifikasi email..." />
      ) : (
        <div className="flex flex-col items-center py-2 text-center">
          {state.status === 'ok' ? (
            <CircleCheck className="h-14 w-14 text-green-600" strokeWidth={1.6} />
          ) : (
            <CircleX className="h-14 w-14 text-red-500" strokeWidth={1.6} />
          )}
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{state.pesan}</p>
          {state.status === 'error' && (
            <p className="mt-3 text-sm text-slate-500">
              Link kedaluwarsa?{' '}
              <Link to="/daftar" className="font-semibold text-maroon-700 hover:text-maroon-800">
                Daftar ulang dengan email yang sama
              </Link>{' '}
              untuk menerima link baru.
            </p>
          )}
        </div>
      )}
    </AuthShell>
  );
}
