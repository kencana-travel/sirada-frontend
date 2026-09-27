import { Bus } from 'lucide-react';
import { classNames } from '../lib/format';

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
  const box = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const title = size === 'lg' ? 'text-xl' : 'text-base';
  const titleColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const taglineColor = variant === 'light' ? 'text-white/60' : 'text-slate-500';

  return (
    <div className={classNames('flex items-center gap-3', className)}>
      <span
        className={classNames(
          'grid shrink-0 place-items-center rounded-xl bg-maroon-700 text-white shadow-sm',
          box,
        )}
      >
        <Bus className={icon} strokeWidth={2.2} />
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
