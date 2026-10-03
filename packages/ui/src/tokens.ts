import { COLOR_TOKENS, TYPOGRAPHY } from '@classo/config';

/**
 * Classo Design System Tokens
 * Strict adherence to PRD Section 14 (UI / UX Guidelines)
 *
 * Anti-patterns avoided (PRD 14.2):
 * - No purple/blue neon gradients
 * - No excessive blur / glassmorphism
 * - No default emoji-as-icons
 * - No sterile pure white (#FFFFFF) background — uses Warm Cream (#FAF7F2)
 */

export const colors = {
  ...COLOR_TOKENS,
  border: '#E5E0D8',
  borderHover: '#D3CDC3',
  inputBg: '#FFFFFF',
  hoverBg: '#F3EFEA',
};

export const typography = {
  ...TYPOGRAPHY,
  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
};

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};
