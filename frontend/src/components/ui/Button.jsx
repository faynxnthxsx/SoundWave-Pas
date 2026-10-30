import React from 'react';

const VARIANT_STYLES = {
  primary:
    'bg-gradient-to-r from-cyan-300 to-teal-300 text-slate-950 font-black hover:from-white hover:to-white shadow-lg shadow-cyan-400/20 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-400',
  secondary:
    'bg-white text-black font-bold hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-400',
  cyanOutline:
    'border border-cyan-300/30 bg-cyan-300/10 font-semibold text-cyan-100 hover:bg-cyan-300/20',
  outline:
    'border border-white/10 bg-white/[0.03] font-semibold text-gray-300 hover:text-white hover:bg-white/10',
  ghost:
    'text-gray-300 font-semibold hover:text-white hover:bg-white/5',
  danger:
    'border border-rose-400/30 bg-rose-500/10 font-semibold text-rose-200 hover:bg-rose-500/20',
};

const SIZE_STYLES = {
  xs: 'px-2.5 py-1 text-[11px] rounded-lg',
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-4 py-2.5 text-xs rounded-xl',
  lg: 'px-4 py-3.5 text-sm rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.sm;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
