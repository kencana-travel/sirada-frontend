import { ChevronLeft, ChevronRight } from 'lucide-react';
import { classNames, formatNumber } from '../lib/format';

interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

function pageWindow(current: number, totalPages: number): (number | '…')[] {
  const pages: (number | '…')[] = [];
  const push = (p: number | '…') => pages.push(p);
  const around = [current - 1, current, current + 1].filter((p) => p > 1 && p < totalPages);
  push(1);
  if (around[0] && around[0] > 2) push('…');
  around.forEach(push);
  if (totalPages > 1) {
    if (around[around.length - 1] && around[around.length - 1] < totalPages - 1) push('…');
    push(totalPages);
  }
  return pages;
}

export default function Pagination({ page, perPage, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-hairline px-5 py-3.5 sm:flex-row">
      <p className="text-xs text-slate-500">
        Menampilkan <span className="font-semibold text-slate-700">{formatNumber(from)}</span>–
        <span className="font-semibold text-slate-700">{formatNumber(to)}</span> dari{' '}
        <span className="font-semibold text-slate-700">{formatNumber(total)}</span> transaksi
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="grid h-8 w-8 place-items-center rounded-lg border border-hairline text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1.5 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={classNames(
                'h-8 min-w-8 rounded-lg px-2.5 text-sm font-medium transition-colors',
                p === page
                  ? 'bg-maroon-700 text-white'
                  : 'border border-hairline text-slate-600 hover:bg-slate-50',
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="grid h-8 w-8 place-items-center rounded-lg border border-hairline text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
