import { classNames } from '../lib/format';

type BarColor = 'maroon' | 'green' | 'amber' | 'red' | 'blue' | 'slate';

interface ProgressBarProps {
  value: number; // 0 - 100
  color?: BarColor;
  /** Warna otomatis berdasarkan ambang (rendah=merah? tergantung konteks). */
  className?: string;
  trackClassName?: string;
  height?: 'sm' | 'md';
}

const colors: Record<BarColor, string> = {
  maroon: 'bg-maroon-600',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  slate: 'bg-slate-400',
};

export default function ProgressBar({
  value,
  color = 'maroon',
  className,
  trackClassName,
  height = 'md',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={classNames(
        'w-full overflow-hidden rounded-full bg-slate-100',
        height === 'sm' ? 'h-1.5' : 'h-2.5',
        trackClassName,
        className,
      )}
    >
      <div
        className={classNames('h-full rounded-full transition-[width] duration-500', colors[color])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Warna load factor: hijau normal, kuning waspada, merah kritis. */
export function loadFactorColor(persen: number): BarColor {
  if (persen >= 85) return 'red';
  if (persen >= 70) return 'amber';
  return 'blue';
}

/** Warna okupansi: merah rendah, kuning sedang, hijau tinggi. */
export function okupansiColor(persen: number): BarColor {
  if (persen >= 75) return 'green';
  if (persen >= 50) return 'amber';
  return 'red';
}
