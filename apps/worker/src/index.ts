/**
 * Classo Async Worker Service (PRD Section 10)
 * Handles BullMQ background queues:
 * - Fee reminders (REM-*)
 * - Message sender workers (continuous)
 * - PDF generation (receipts, slips, report cards)
 * - Bulk imports/exports
 */

export const QUEUE_NAMES = {
  FEE_REMINDERS: 'fee-reminders',
  MESSAGING: 'messaging',
  PDF_GENERATION: 'pdf-generation',
  BULK_DATA: 'bulk-data',
} as const;

export function initWorker() {
  console.log('Classo Background Worker initialized.');
}
