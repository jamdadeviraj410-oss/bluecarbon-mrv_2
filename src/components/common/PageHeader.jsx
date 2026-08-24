import { Link } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions = null,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-4 pb-2 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-xs font-mono-data text-on-surface-variant">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {idx > 0 && <span>/</span>}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  {crumb.icon && (
                    <span className="material-symbols-outlined text-[16px]">{crumb.icon}</span>
                  )}
                  <span>{crumb.label}</span>
                </Link>
              ) : (
                <span className="text-primary font-semibold truncate">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-lg text-2xl sm:text-3xl text-primary font-bold tracking-tight m-0">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="font-body-md text-sm text-on-surface-variant m-0">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
