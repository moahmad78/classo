import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'primary';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    success: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
    danger: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
    warning: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    primary: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]',
    neutral: 'bg-[#F3EFEA] text-[#1F2937] border-[#E5E0D8]',
  };

  const defaultIcons = {
    success: (
      <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="currentColor">
        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    danger: (
      <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="currentColor">
        <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    warning: (
      <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 3V7M6 9.5V9.51" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    primary: (
      <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="6" cy="6" r="3" fill="currentColor" />
      </svg>
    ),
    neutral: (
      <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="6" cy="6" r="2.5" fill="currentColor" />
      </svg>
    ),
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon ?? defaultIcons[variant]}
      {children}
    </span>
  );
};
