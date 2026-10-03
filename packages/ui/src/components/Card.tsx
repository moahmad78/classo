import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-[#E5E0D8] rounded-xl shadow-[0_2px_8px_-1px_rgba(31,41,55,0.05)] transition-all hover:border-[#D3CDC3] p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`border-b border-[#FAF7F2] pb-4 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3
      className={`text-lg font-bold text-[#1F2937] tracking-tight font-heading ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};
