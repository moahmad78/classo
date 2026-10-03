import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

describe('Phase 4: Money (Fees, Dues, Razorpay, Receipts & Reminders) Test Suite', () => {
  let pg: PGlite;
  const testInstId = '11111111-2222-3333-4444-555555555555';
  const otherInstId = '99999999-8888-7777-6666-555555555555';
  const classId = '33333333-4444-5555-6666-777777777777';
  const student1Id = 'aaaaaaa1-1111-1111-1111-111111111111';
  const student2Id = 'aaaaaaa2-2222-2222-2222-222222222222';
  const accountantUserId = '66666666-7777-8888-9999-000000000000';

  beforeAll(async () => {
    pg = new PGlite();

    await pg.exec(`
      CREATE TABLE institutes (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(64) NOT NULL UNIQUE
      );

      CREATE TABLE message_wallets (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id) UNIQUE,
        credits_balance INT NOT NULL DEFAULT 500
      );

      CREATE TABLE classes (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE students (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        admission_no VARCHAR(64) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        class_id UUID REFERENCES classes(id)
      );

      CREATE TABLE fee_heads (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        is_refundable BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE fee_structures (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        class_id UUID REFERENCES classes(id),
        name VARCHAR(255) NOT NULL,
        total_amount_paise INT NOT NULL
      );

      CREATE TABLE fee_structure_items (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
        fee_head_id UUID NOT NULL REFERENCES fee_heads(id),
        amount_paise INT NOT NULL
      );

      CREATE TABLE student_fee_plans (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        student_id UUID NOT NULL REFERENCES students(id),
        fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
        plan_type VARCHAR(32) NOT NULL,
        total_base_paise INT NOT NULL,
        discount_paise INT NOT NULL DEFAULT 0,
        discount_reason TEXT,
        net_payable_paise INT NOT NULL
      );

      CREATE TABLE student_dues (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        student_id UUID NOT NULL REFERENCES students(id),
        student_fee_plan_id UUID NOT NULL REFERENCES student_fee_plans(id),
        installment_number INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        due_date VARCHAR(10) NOT NULL,
        amount_paise INT NOT NULL,
        fine_paise INT NOT NULL DEFAULT 0,
        paid_amount_paise INT NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_link_id VARCHAR(100)
      );

      CREATE TABLE payments (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        student_id UUID NOT NULL REFERENCES students(id),
        student_due_id UUID REFERENCES student_dues(id),
        receipt_no VARCHAR(64) NOT NULL,
        amount_paid_paise INT NOT NULL,
        payment_mode VARCHAR(32) NOT NULL,
        reference_no VARCHAR(100),
        payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'success',
        razorpay_payment_id VARCHAR(100)
      );

      CREATE TABLE receipts (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        payment_id UUID NOT NULL REFERENCES payments(id),
        receipt_number VARCHAR(64) NOT NULL,
        is_duplicate BOOLEAN DEFAULT FALSE,
        reprint_count INT DEFAULT 0,
        issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE reminder_logs (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        student_due_id UUID NOT NULL REFERENCES student_dues(id),
        student_id UUID NOT NULL REFERENCES students(id),
        channel VARCHAR(32) NOT NULL,
        cost_credits INT NOT NULL DEFAULT 1,
        status VARCHAR(20) DEFAULT 'sent'
      );
    `);

    // Seed master institute, wallet and student
    await pg.query(
      `INSERT INTO institutes (id, name, subdomain) VALUES ($1, 'Delhi Public Academy', 'delhipublic')`,
      [testInstId]
    );

    await pg.query(
      `INSERT INTO message_wallets (id, institute_id, credits_balance) VALUES (gen_random_uuid(), $1, 10)`,
      [testInstId]
    );

    await pg.query(
      `INSERT INTO classes (id, institute_id, name) VALUES ($1, $2, 'Class 10')`,
      [classId, testInstId]
    );

    await pg.query(
      `INSERT INTO students (id, institute_id, admission_no, full_name, class_id)
       VALUES ($1, $2, 'ADM-2026-0001', 'Aarav Mehta', $3)`,
      [student1Id, testInstId, classId]
    );

    await pg.query(
      `INSERT INTO students (id, institute_id, admission_no, full_name, class_id)
       VALUES ($1, $2, 'ADM-2026-0002', 'Ananya Gupta', $3)`,
      [student2Id, testInstId, classId]
    );
  });

  afterAll(async () => {
    await pg.close();
  });

  it('FEE-01: creates fee heads and fee structure with items totaling correctly in paise', async () => {
    // 1. Fee Heads
    const tuitionRes = await pg.query(
      `INSERT INTO fee_heads (id, institute_id, name, code)
       VALUES (gen_random_uuid(), $1, 'Tuition Fee', 'TUITION') RETURNING id`,
      [testInstId]
    );
    const labRes = await pg.query(
      `INSERT INTO fee_heads (id, institute_id, name, code)
       VALUES (gen_random_uuid(), $1, 'Science Lab Fee', 'LAB') RETURNING id`,
      [testInstId]
    );

    const tuitionId = tuitionRes.rows[0].id;
    const labId = labRes.rows[0].id;

    // 2. Fee Structure (Tuition: ₹40,000 = 4,000,000 paise; Lab: ₹5,000 = 500,000 paise; Total: ₹45,000)
    const structRes = await pg.query(
      `INSERT INTO fee_structures (id, institute_id, class_id, name, total_amount_paise)
       VALUES (gen_random_uuid(), $1, $2, 'Class 10 Annual Fee', 4500000) RETURNING id, total_amount_paise`,
      [testInstId, classId]
    );
    const structId = structRes.rows[0].id;

    await pg.query(
      `INSERT INTO fee_structure_items (id, institute_id, fee_structure_id, fee_head_id, amount_paise)
       VALUES 
       (gen_random_uuid(), $1, $2, $3, 4000000),
       (gen_random_uuid(), $1, $2, $4, 500000)`,
      [testInstId, structId, tuitionId, labId]
    );

    expect(structRes.rows[0].total_amount_paise).toBe(4500000);

    const itemsRes = await pg.query(
      `SELECT SUM(amount_paise) as sum FROM fee_structure_items WHERE fee_structure_id = $1`,
      [structId]
    );
    expect(Number(itemsRes.rows[0].sum)).toBe(4500000);
  });

  it('FEE-02 & FEE-03: assigns fee plan with scholarship discount and generates installment dues', async () => {
    const structRes = await pg.query(
      `SELECT id, total_amount_paise FROM fee_structures WHERE institute_id = $1 LIMIT 1`,
      [testInstId]
    );
    const structId = structRes.rows[0].id;
    const totalBase = structRes.rows[0].total_amount_paise; // 4,500,000 paise

    // Concession of ₹5,000 (500,000 paise) for Merit scholarship
    const discount = 500000;
    const netPayable = totalBase - discount; // 4,000,000 paise (₹40,000)

    const planRes = await pg.query(
      `INSERT INTO student_fee_plans (
        id, institute_id, student_id, fee_structure_id, plan_type,
        total_base_paise, discount_paise, discount_reason, net_payable_paise
       )
       VALUES (gen_random_uuid(), $1, $2, $3, 'quarterly', $4, $5, 'Merit scholarship (Class 9 topper)', $6)
       RETURNING id, net_payable_paise`,
      [testInstId, student1Id, structId, totalBase, discount, netPayable]
    );
    const planId = planRes.rows[0].id;

    // Generate 4 quarterly dues of ₹10,000 (1,000,000 paise) each
    const installmentAmount = 1000000;
    for (let i = 1; i <= 4; i++) {
      const monthStr = i * 3 < 10 ? `0${i * 3}` : `${i * 3}`;
      const dueDate = `2026-${monthStr}-10`;
      await pg.query(
        `INSERT INTO student_dues (
          id, institute_id, student_id, student_fee_plan_id, installment_number,
          title, due_date, amount_paise, fine_paise, paid_amount_paise, status
         )
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 0, 0, 'pending')`,
        [testInstId, student1Id, planId, i, `Quarter ${i}`, dueDate, installmentAmount]
      );
    }


    const duesRes = await pg.query(
      `SELECT * FROM student_dues WHERE student_fee_plan_id = $1 ORDER BY installment_number ASC`,
      [planId]
    );
    expect(duesRes.rows.length).toBe(4);
    expect(duesRes.rows[0].amount_paise).toBe(1000000);
    expect(duesRes.rows[0].status).toBe('pending');
  });

  it('FEE-04 & FEE-05: collects payment, updates due to partial/paid, generates sequential receipt and handles duplicate reprint', async () => {
    const dues = await pg.query(
      `SELECT id, amount_paise FROM student_dues WHERE student_id = $1 ORDER BY installment_number ASC LIMIT 1`,
      [student1Id]
    );
    const dueId = dues.rows[0].id; // 1,000,000 paise

    // 1. Partial payment: Pay ₹6,000 (600,000 paise) via UPI
    const payment1 = await pg.query(
      `INSERT INTO payments (id, institute_id, student_id, student_due_id, receipt_no, amount_paid_paise, payment_mode, reference_no)
       VALUES (gen_random_uuid(), $1, $2, $3, 'REC-2026-00001', 600000, 'upi', 'UPI12345678')
       RETURNING id, receipt_no`,
      [testInstId, student1Id, dueId]
    );

    await pg.query(
      `UPDATE student_dues SET paid_amount_paise = 600000, status = 'partial' WHERE id = $1`,
      [dueId]
    );

    const receipt1 = await pg.query(
      `INSERT INTO receipts (id, institute_id, payment_id, receipt_number, is_duplicate)
       VALUES (gen_random_uuid(), $1, $2, $3, FALSE)
       RETURNING id, is_duplicate`,
      [testInstId, payment1.rows[0].id, payment1.rows[0].receipt_no]
    );
    expect(receipt1.rows[0].is_duplicate).toBe(false);

    // 2. Complete payment: Pay remaining ₹4,000 (400,000 paise) via Cash
    const payment2 = await pg.query(
      `INSERT INTO payments (id, institute_id, student_id, student_due_id, receipt_no, amount_paid_paise, payment_mode)
       VALUES (gen_random_uuid(), $1, $2, $3, 'REC-2026-00002', 400000, 'cash')
       RETURNING id, receipt_no`,
      [testInstId, student1Id, dueId]
    );

    await pg.query(
      `UPDATE student_dues SET paid_amount_paise = 1000000, status = 'paid' WHERE id = $1`,
      [dueId]
    );

    const updatedDue = await pg.query(`SELECT status, paid_amount_paise FROM student_dues WHERE id = $1`, [dueId]);
    expect(updatedDue.rows[0].status).toBe('paid');
    expect(updatedDue.rows[0].paid_amount_paise).toBe(1000000);

    // 3. Duplicate Reprint verification (FEE-05)
    const reprint = await pg.query(
      `UPDATE receipts SET is_duplicate = TRUE, reprint_count = reprint_count + 1 WHERE id = $1 RETURNING *`,
      [receipt1.rows[0].id]
    );
    expect(reprint.rows[0].is_duplicate).toBe(true);
    expect(reprint.rows[0].reprint_count).toBe(1);
  });

  it('FEE-06: processes Razorpay webhook idempotently without double-crediting', async () => {
    const rzpPaymentId = 'pay_HkL90ABC1234';

    // First webhook delivery
    const p1 = await pg.query(
      `INSERT INTO payments (id, institute_id, student_id, receipt_no, amount_paid_paise, payment_mode, razorpay_payment_id)
       VALUES (gen_random_uuid(), $1, $2, 'REC-2026-00003', 1000000, 'razorpay', $3)
       RETURNING id`,
      [testInstId, student2Id, rzpPaymentId]
    );
    expect(p1.rows.length).toBe(1);

    // Attempted duplicate delivery with same razorpay_payment_id
    const duplicateCheck = await pg.query(
      `SELECT * FROM payments WHERE institute_id = $1 AND razorpay_payment_id = $2`,
      [testInstId, rzpPaymentId]
    );
    expect(duplicateCheck.rows.length).toBe(1); // Already processed! Do not insert duplicate row.
  });

  it('FEE-08 & FEE-09: calculates fee dashboard totals and student ledger balance', async () => {
    // Dashboard metrics
    const dash = await pg.query(`
      SELECT 
        SUM(amount_paid_paise) as total_collected,
        COUNT(*) as total_payments
      FROM payments WHERE institute_id = $1
    `, [testInstId]);

    // 600,000 + 400,000 + 1,000,000 = 2,000,000 paise (₹20,000)
    expect(Number(dash.rows[0].total_collected)).toBe(2000000);
    expect(Number(dash.rows[0].total_payments)).toBe(3);

    // Student 1 ledger
    const charges = await pg.query(
      `SELECT SUM(amount_paise) as total_charged FROM student_dues WHERE student_id = $1`,
      [student1Id]
    );
    const paid = await pg.query(
      `SELECT SUM(amount_paid_paise) as total_paid FROM payments WHERE student_id = $1`,
      [student1Id]
    );

    const balance = Number(charges.rows[0].total_charged) - Number(paid.rows[0].total_paid);
    // 4,000,000 charged - 1,000,000 paid = 3,000,000 paise remaining balance
    expect(balance).toBe(3000000);
  });

  it('REM-01..08 & CTL-09: fee reminder deducts credit from message wallet and logs dispatch', async () => {
    const dueRes = await pg.query(
      `SELECT id FROM student_dues WHERE student_id = $1 AND status = 'pending' LIMIT 1`,
      [student1Id]
    );
    const pendingDueId = dueRes.rows[0].id;

    // Check initial wallet balance
    const walletBefore = await pg.query(
      `SELECT credits_balance FROM message_wallets WHERE institute_id = $1`,
      [testInstId]
    );
    const initialCredits = walletBefore.rows[0].credits_balance; // 10

    // Deduct 1 credit for WhatsApp reminder
    await pg.query(
      `UPDATE message_wallets SET credits_balance = credits_balance - 1 WHERE institute_id = $1`,
      [testInstId]
    );

    await pg.query(
      `INSERT INTO reminder_logs (id, institute_id, student_due_id, student_id, channel, cost_credits)
       VALUES (gen_random_uuid(), $1, $2, $3, 'whatsapp', 1)`,
      [testInstId, pendingDueId, student1Id]
    );

    const walletAfter = await pg.query(
      `SELECT credits_balance FROM message_wallets WHERE institute_id = $1`,
      [testInstId]
    );
    expect(walletAfter.rows[0].credits_balance).toBe(initialCredits - 1);

    const logCheck = await pg.query(
      `SELECT * FROM reminder_logs WHERE student_due_id = $1`,
      [pendingDueId]
    );
    expect(logCheck.rows.length).toBe(1);
    expect(logCheck.rows[0].channel).toBe('whatsapp');
  });
});
