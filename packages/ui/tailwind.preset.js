/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E', // Deep Teal
          hover: '#0D6861',
          light: '#F0FDFA',
        },
        accent: {
          DEFAULT: '#F59E0B', // Marigold
          hover: '#D97706',
          light: '#FEF3C7',
        },
        bg: {
          warm: '#FAF7F2', // Warm Cream background
        },
        surface: {
          DEFAULT: '#FFFFFF',
        },
        text: {
          primary: '#1F2937',
          muted: '#6B7280',
        },
        success: {
          DEFAULT: '#15803D',
          light: '#DCFCE7',
        },
        danger: {
          DEFAULT: '#B91C1C',
          light: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#B45309',
          light: '#FEF3C7',
        },
        border: {
          warm: '#E5E0D8',
          hover: '#D3CDC3',
        },
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Nunito Sans', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        warm: '0 2px 8px -1px rgba(31, 41, 55, 0.05), 0 1px 3px -1px rgba(31, 41, 55, 0.03)',
        'warm-lg': '0 10px 25px -3px rgba(31, 41, 55, 0.07), 0 4px 6px -2px rgba(31, 41, 55, 0.03)',
      },
    },
  },
};
