/** Utilitas format angka, mata uang, dan persen (locale id-ID). */

export function formatCurrency(value: number | null | undefined, opts?: { compact?: boolean }): string {
  const n = Number(value ?? 0);
  if (opts?.compact) {
    return `Rp${formatCompact(n)}`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('id-ID').format(Number(value ?? 0));
}

export function formatCompact(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',')} rb`;
  return formatNumber(n);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  const n = Number(value ?? 0);
  return `${n.toFixed(digits).replace('.', ',')}%`;
}

/** Persen perubahan bertanda: +12,5% / -3,2%. */
export function formatDelta(value: number | null | undefined, digits = 1): string {
  const n = Number(value ?? 0);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits).replace('.', ',')}%`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function classNames(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

/** Nama model tanpa ordo, mis. "SARIMAX(1,0,1)(0,1,1,7)+kalender" -> "SARIMAX + kalender". */
export function namaModel(model: string | null | undefined): string {
  return (model ?? '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\+\s*/g, ' + ')
    .trim();
}
