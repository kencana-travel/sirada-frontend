import type { ReactNode } from 'react';
import { classNames } from '../lib/format';

interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Elemen di sisi kanan header (tombol, badge, dsb). */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Hilangkan padding pada body (mis. untuk tabel penuh). */
  noPadding?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  action,
  icon,
  className,
  bodyClassName,
  noPadding,
}: CardProps) {
  const hasHeader = title || subtitle || action;
  return (
    <div
      className={classNames(
        'rounded-xl border border-hairline bg-white shadow-card',
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-maroon-50 text-maroon-700">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="truncate text-sm font-bold text-slate-900">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={classNames(!noPadding && 'p-5', bodyClassName)}>{children}</div>
    </div>
  );
}
