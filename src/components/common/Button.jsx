export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  icon,
  iconPosition = 'left',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-title-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface cursor-pointer select-none';
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary-container shadow-sm hover:shadow-md focus:ring-primary',
    secondary: 'bg-secondary text-on-secondary hover:bg-secondary/90 shadow-sm hover:shadow-md focus:ring-secondary',
    tertiary: 'bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/90 shadow-sm focus:ring-tertiary-container',
    outline: 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container hover:border-outline focus:ring-primary',
    ghost: 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container focus:ring-primary',
    text: 'bg-transparent text-primary hover:text-primary-container hover:bg-surface-variant/50 focus:ring-primary',
    error: 'bg-error text-on-error hover:bg-error/90 shadow-sm focus:ring-error',
    danger: 'bg-error text-on-error hover:bg-error/90 shadow-sm focus:ring-error',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
      ) : (
        icon && iconPosition === 'left' && (
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        )
      )}
      {children}
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
    </button>
  );
}

