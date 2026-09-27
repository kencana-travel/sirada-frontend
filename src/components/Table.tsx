import type { ReactNode } from 'react';
import { classNames } from '../lib/format';
import { Skeleton } from './Spinner';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: (row: T, index: number) => string | number;
  loading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export default function Table<T>({
  columns,
  data,
  keyField,
  loading = false,
  skeletonRows = 6,
  emptyMessage = 'Tidak ada data untuk ditampilkan.',
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline">
            {columns.map((col) => (
              <th
                key={col.key}
                className={classNames(
                  'whitespace-nowrap bg-slate-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                  alignClass[col.align ?? 'left'],
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, r) => (
              <tr key={`sk-${r}`} className="border-b border-hairline">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyField(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={classNames(
                  'border-b border-hairline last:border-0 transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-maroon-50/40' : 'hover:bg-slate-50/60',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={classNames(
                      'px-4 py-3.5 align-middle text-slate-700',
                      alignClass[col.align ?? 'left'],
                      col.className,
                    )}
                  >
                    {col.render ? col.render(row, index) : (row as Record<string, ReactNode>)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
