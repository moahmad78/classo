import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#1F2937]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#1F2937] placeholder-[#6B7280] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent disabled:bg-[#FAF7F2] disabled:cursor-not-allowed ${
            error ? 'border-[#B91C1C] focus:ring-[#B91C1C]' : 'border-[#E5E0D8]'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-[#B91C1C] mt-1 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#6B7280] mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
