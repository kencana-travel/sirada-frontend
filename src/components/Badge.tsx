import type { ReactNode } from 'react';
import { classNames } from '../lib/format';

export type BadgeTone =
  | 'green'
  | 'amber'
  | 'red'
  | 'maroon'
  | 'slate'
  | 'blue'
  | 'purple'
  | 'gold';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  maroon: 'bg-maroon-50 text-maroon-700 ring-maroon-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  gold: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
};

const dots: Record<BadgeTone, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  maroon: 'bg-maroon-600',
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  gold: 'bg-yellow-500',
};

export default function Badge({ children, tone = 'slate', dot, size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        tones[tone],
        className,
      )}
    >
      {dot && <span className={classNames('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}

/** Peta jenis member → warna badge yang konsisten di seluruh aplikasi. */
export function memberTone(jenis: string): BadgeTone {
  const v = jenis.toLowerCase();
  if (v.includes('mahasiswa')) return 'blue';
  if (v.includes('umum')) return 'maroon';
  if (v.includes('non')) return 'slate';
  return 'slate';
}

/** Peta status loyalitas → warna badge sesuai spesifikasi. */
export function loyalitasTone(status: string): BadgeTone {
  const v = status.toLowerCase();
  if (v.includes('platinum')) return 'purple';
  if (v.includes('gold')) return 'gold';
  if (v.includes('silver')) return 'slate';
  if (v.includes('calon')) return 'blue';
  return 'slate';
}

/** Peta layanan → warna badge. */
export function layananTone(layanan: string): BadgeTone {
  return layanan.toLowerCase().includes('vip') ? 'maroon' : 'blue';
}
