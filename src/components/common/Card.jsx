export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  accentTop = null,
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const accentColors = {
    primary: 'border-t-[3px] border-t-primary',
    secondary: 'border-t-[3px] border-t-secondary',
    tertiary: 'border-t-[3px] border-t-tertiary-container',
    error: 'border-t-[3px] border-t-error',
    warning: 'border-t-[3px] border-t-amber-500',
  };

  return (
    <div
      className={`bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
        hover ? 'hover:shadow-[0_4px_16px_rgba(0,51,102,0.06)] hover:border-outline-variant/60 transition-all duration-200' : ''
      } ${accentTop ? accentColors[accentTop] || 'border-t-[3px] border-t-primary' : ''} ${
        paddings[padding] || paddings.md
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20 mb-5 ${className}`}>
      <div>
        {title && <h3 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface tracking-tight m-0">{title}</h3>}
        {subtitle && <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-1 m-0">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
