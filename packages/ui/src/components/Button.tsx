import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px]';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-xl',
    };

    const variantStyles = {
      primary:
        'bg-[#0F766E] text-white hover:bg-[#0D6861] active:bg-[#0A524C] focus:ring-[#0F766E]',
      accent:
        'bg-[#F59E0B] text-[#1F2937] hover:bg-[#D97706] active:bg-[#B45309] focus:ring-[#F59E0B] font-semibold',
      outline:
        'border border-[#E5E0D8] bg-white text-[#1F2937] hover:bg-[#FAF7F2] hover:border-[#D3CDC3] focus:ring-[#0F766E]',
      ghost:
        'text-[#1F2937] hover:bg-[#FAF7F2] active:bg-[#E5E0D8] focus:ring-[#0F766E]',
      danger:
        'bg-[#B91C1C] text-white hover:bg-[#991B1B] active:bg-[#7F1D1D] focus:ring-[#B91C1C]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
