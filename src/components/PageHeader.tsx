import { Fragment, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Badge, { type BadgeTone } from './Badge';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  badge?: { label: string; tone?: BadgeTone; dot?: boolean };
  breadcrumb?: string[];
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, badge, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1 text-xs text-slate-400">
            {breadcrumb.map((crumb, i) => (
              <Fragment key={crumb}>
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={i === breadcrumb.length - 1 ? 'text-slate-600' : undefined}>
                  {crumb}
                </span>
              </Fragment>
            ))}
          </nav>
        )}
        {badge && (
          <Badge tone={badge.tone ?? 'maroon'} dot={badge.dot} className="mb-2">
            {badge.label}
          </Badge>
        )}
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 lg:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
