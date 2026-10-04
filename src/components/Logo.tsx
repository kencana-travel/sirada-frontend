import { classNames } from '../lib/format';
import kencanaEmblem from '../assets/kencana-emblem.png';
import kencanaWordmark from '../assets/kencana-logo.png';

interface LogoProps {
  /** 'light' untuk latar gelap (sidebar), 'dark' untuk latar putih (login). */
  variant?: 'light' | 'dark';
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({
  variant = 'dark',
  showTagline = true,
  size = 'md',
  className,
}: LogoProps) {
  const titleColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const taglineColor = variant === 'light' ? 'text-white/60' : 'text-slate-500';

  // Halaman login/auth: logo Kencana utuh, lalu nama sistem di sebelahnya.
  if (size === 'lg' && variant === 'dark') {
    return (
      <div className={classNames('flex items-center gap-4', className)}>
        <img src={kencanaWordmark} alt="Kencana" className="h-14 w-auto shrink-0" />
        <div className="h-10 w-px shrink-0 bg-hairline" />
        <div className="leading-tight">
          <div className={classNames('text-xl font-extrabold tracking-tight', titleColor)}>
            SIRADA
          </div>
          {showTagline && (
            <div className={classNames('text-[11px] font-medium', taglineColor)}>
              Sistem Informasi Rute dan Demand Analitik
            </div>
          )}
        </div>
      </div>
    );
  }

  const box = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const title = size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className={classNames('flex items-center gap-3', className)}>
      {/* Tile putih supaya logo merah tetap kontras di sidebar maroon. */}
      <span
        className={classNames(
          'grid shrink-0 place-items-center rounded-xl bg-white p-1 shadow-sm',
          box,
        )}
      >
        <img src={kencanaEmblem} alt="Kencana" className="h-full w-full object-contain" />
      </span>
      <div className="leading-tight">
        <div className={classNames('font-extrabold tracking-tight', title, titleColor)}>
          SIRADA <span className="text-maroon-400">Kencana</span>
        </div>
        {showTagline && (
          <div className={classNames('text-[11px] font-medium', taglineColor)}>
            Sistem Informasi Rute dan Demand Analitik
          </div>
        )}
      </div>
    </div>
  );
}
