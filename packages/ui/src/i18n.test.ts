import { describe, it, expect } from 'vitest';
import { formatINR, formatDateIST, formatTimeIST, MICROCOPY } from './i18n.js';

describe('Phase 0 i18n & Microcopy Formatting', () => {
  it('CC-07 & 9.3: formatINR converts paise integers into formatted Indian currency', () => {
    // 250000 paise = 2,500 rupees
    expect(formatINR(250000)).toBe('₹ 2,500');
    // 10000000 paise = 1,00,000 rupees (1 Lakh)
    expect(formatINR(10000000)).toBe('₹ 1,00,000');
    // 50 paise = 0.50 rupees with decimals
    expect(formatINR(50, true)).toBe('₹ 0.50');
  });

  it('CC-07 & CC-11: formatDateIST formats UTC dates in DD/MM/YYYY Asia/Kolkata', () => {
    // 2026-10-03T00:00:00Z -> 03/10/2026 in IST
    const dateStr = '2026-10-03T04:30:00.000Z';
    expect(formatDateIST(dateStr)).toBe('03/10/2026');
  });

  it('14.6: MICROCOPY contains authentic English and Hinglish strings', () => {
    expect(MICROCOPY.en.attendance.saved(3)).toBe('Attendance saved. 3 students absent.');
    expect(MICROCOPY['hi-en'].attendance.saved(3)).toBe(
      'Attendance save ho gayi. 3 bachche absent the.'
    );
    expect(MICROCOPY['hi-en'].homework.empty).toBe('Abhi koi homework nahi hai. Aaram se!');
    expect(MICROCOPY['hi-en'].fees.dueReminder('2,500', '10 Oct')).toBe(
      '₹2,500 baaki hai, 10 Oct tak.'
    );
  });
});
