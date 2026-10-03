/**
 * Classo Internationalization & Microcopy Utility
 * PRD CC-07, CC-11, Section 14.6
 */

export type Locale = 'en' | 'hi-en';

export const MICROCOPY = {
  en: {
    attendance: {
      saved: (absentCount: number) =>
        absentCount === 0
          ? 'Attendance recorded. All students are present!'
          : `Attendance saved. ${absentCount} student${absentCount > 1 ? 's' : ''} absent.`,
      pending: 'Attendance is pending for today.',
      markNow: 'Mark Attendance',
    },
    homework: {
      empty: 'No homework assigned yet. Relax!',
      newAssigned: 'New homework assigned.',
      submitted: 'Homework submitted successfully.',
    },
    fees: {
      dueReminder: (amountRupees: string, dueDate: string) =>
        `₹${amountRupees} is due by ${dueDate}.`,
      paidSuccess: 'Payment received. The receipt has been sent to your WhatsApp.',
      receiptGenerated: 'Receipt generated successfully.',
    },
    errors: {
      notFound: "This page couldn't be found. Let's head back to the dashboard.",
      generic: 'Something went wrong. Please try again, or reach out to us if it persists.',
      unauthorized: 'You do not have permission to view this section.',
      rateLimited: 'Too many attempts. Please wait a few moments before trying again.',
    },
    selfieAttendance: {
      consentRequired: 'Camera and location consent is required to mark attendance.',
      captured: 'Selfie captured. Checking campus location...',
      geofenceSuccess: 'Location verified inside campus. Attendance marked!',
      geofenceFlagged: 'Outside campus geofence. Sent to Principal for review.',
    },
  },
  'hi-en': {
    attendance: {
      saved: (absentCount: number) =>
        absentCount === 0
          ? 'Attendance save ho gayi. Sabhi bachche present hain!'
          : `Attendance save ho gayi. ${absentCount} bachche absent the.`,
      pending: 'Aaj ki attendance lagana baaki hai.',
      markNow: 'Attendance Lagayein',
    },
    homework: {
      empty: 'Abhi koi homework nahi hai. Aaram se!',
      newAssigned: 'Naya homework mila hai.',
      submitted: 'Homework submit ho gaya.',
    },
    fees: {
      dueReminder: (amountRupees: string, dueDate: string) =>
        `₹${amountRupees} baaki hai, ${dueDate} tak.`,
      paidSuccess: 'Payment mil gaya. Receipt aapko WhatsApp par bhej di hai.',
      receiptGenerated: 'Receipt ban gayi hai.',
    },
    errors: {
      notFound: 'Ye page nahi mila. Chalo wapas dashboard par chalte hain.',
      generic: 'Kuch gadbad ho gayi. Dobara try karein, na chale to hume batayein.',
      unauthorized: 'Aapke paas is page ko dekhne ki permission nahi hai.',
      rateLimited: 'Bahut saare attempts ho gaye. Thoda intezar karein.',
    },
    selfieAttendance: {
      consentRequired: 'Attendance ke liye camera aur location ki permission zaroori hai.',
      captured: 'Photo le li gayi. Campus location verify ho rahi hai...',
      geofenceSuccess: 'Campus ke andar location verified. Attendance lag gayi!',
      geofenceFlagged: 'Campus se bahar hain. Review ke liye Principal ke paas bheja gaya.',
    },
  },
} as const;

/**
 * Formats integer paise into Indian Rupee format (e.g., 250000 paise -> "2,500")
 * Money is always stored as BIGINT paise in the database (PRD 9.3).
 */
export function formatINR(paise: number, includeDecimals = false): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  })
    .format(rupees)
    .replace('₹', '₹ ');
}

/**
 * Formats a Date or UTC ISO string into Indian Standard Time DD/MM/YYYY
 * PRD CC-07, CC-11
 */
export function formatDateIST(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats a Date into IST Time (e.g. "09:02 AM")
 */
export function formatTimeIST(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}
