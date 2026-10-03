import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  feeHeads,
  feeStructures,
  feeStructureItems,
  studentFeePlans,
  studentDues,
  payments,
  receipts,
  students,
  users,
  notifications,
  auditLog,
  messageWallets,
  walletTransactions,
  reminderLogs,
} from '@classo/db';
import { eq, and, sql, desc, asc, sum } from 'drizzle-orm';
import * as crypto from 'crypto';
import type {
  CreateFeeHeadDto,
  CreateFeeStructureDto,
  AssignStudentFeePlanDto,
  CollectPaymentDto,
  RazorpayWebhookDto,
} from './fees.dto';

@Injectable()
export class FeesService {
  constructor(private readonly dbService: DatabaseService) {}

  // -------------------------------------------------------------
  // FEE HEADS & STRUCTURES (FEE-01)
  // -------------------------------------------------------------

  async createFeeHead(tenantId: string, dto: CreateFeeHeadDto) {
    const db = this.dbService.getDb();

    const [head] = await db
      .insert(feeHeads)
      .values({
        instituteId: tenantId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        description: dto.description,
        isRefundable: dto.isRefundable ?? false,
      })
      .returning();

    return head;
  }

  async getFeeHeads(tenantId: string) {
    const db = this.dbService.getDb();
    return db
      .select()
      .from(feeHeads)
      .where(eq(feeHeads.instituteId, tenantId))
      .orderBy(asc(feeHeads.name));
  }

  async createFeeStructure(
    tenantId: string,
    userId: string,
    dto: CreateFeeStructureDto
  ) {
    const db = this.dbService.getDb();

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one fee head item is required');
    }

    const totalAmountPaise = dto.items.reduce(
      (acc, item) => acc + item.amountPaise,
      0
    );

    const [structure] = await db
      .insert(feeStructures)
      .values({
        instituteId: tenantId,
        academicYearId: dto.academicYearId,
        classId: dto.classId,
        name: dto.name,
        totalAmountPaise,
      })
      .returning();

    for (const item of dto.items) {
      await db.insert(feeStructureItems).values({
        instituteId: tenantId,
        feeStructureId: structure.id,
        feeHeadId: item.feeHeadId,
        amountPaise: item.amountPaise,
      });
    }

    await db.insert(auditLog).values({
      instituteId: tenantId,
      userId,
      action: 'fee_structure.created',
      entityType: 'fee_structures',
      entityId: structure.id,
      diff: { name: dto.name, totalAmountPaise },
    });

    return {
      ...structure,
      itemCount: dto.items.length,
    };
  }

  async getFeeStructures(tenantId: string, classId?: string) {
    const db = this.dbService.getDb();
    const conditions = [eq(feeStructures.instituteId, tenantId)];
    if (classId) {
      conditions.push(eq(feeStructures.classId, classId));
    }
    return db
      .select()
      .from(feeStructures)
      .where(and(...conditions))
      .orderBy(desc(feeStructures.createdAt));
  }

  // -------------------------------------------------------------
  // STUDENT FEE PLANS & DUES (FEE-02, FEE-03)
  // -------------------------------------------------------------

  async assignStudentFeePlan(
    tenantId: string,
    adminId: string,
    dto: AssignStudentFeePlanDto
  ) {
    const db = this.dbService.getDb();

    const [structure] = await db
      .select()
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.instituteId, tenantId),
          eq(feeStructures.id, dto.feeStructureId)
        )
      );

    if (!structure) {
      throw new NotFoundException('Fee structure not found');
    }

    const discountPaise = dto.discountPaise ?? 0;
    if (discountPaise > 0 && !dto.discountReason) {
      throw new BadRequestException(
        'Mandatory reason required when assigning fee concession/discount (FEE-03)'
      );
    }

    const netPayablePaise = Math.max(0, structure.totalAmountPaise - discountPaise);

    const [plan] = await db
      .insert(studentFeePlans)
      .values({
        instituteId: tenantId,
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        feeStructureId: dto.feeStructureId,
        planType: dto.planType,
        totalBasePaise: structure.totalAmountPaise,
        discountPaise,
        discountReason: dto.discountReason,
        discountApprovedBy: discountPaise > 0 ? adminId : undefined,
        netPayablePaise,
      })
      .returning();

    // Generate installment dues based on plan type (FEE-02)
    const installmentsCount =
      dto.planType === 'one_time' ? 1 : dto.planType === 'quarterly' ? 4 : 10;

    const baseInstallmentPaise = Math.floor(netPayablePaise / installmentsCount);
    let remainderPaise = netPayablePaise - baseInstallmentPaise * installmentsCount;

    const startYear = new Date().getFullYear();
    const createdDues = [];

    for (let i = 1; i <= installmentsCount; i++) {
      const installmentAmount =
        i === 1 ? baseInstallmentPaise + remainderPaise : baseInstallmentPaise;

      // Month calculation
      const monthIndex = (3 + i) % 12 + 1; // starts from April for Indian academic session
      const dueMonth = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
      const dueYear = monthIndex < 4 ? startYear + 1 : startYear;
      const dueDate = `${dueYear}-${dueMonth}-10`; // Due on 10th of the month

      const [due] = await db
        .insert(studentDues)
        .values({
          instituteId: tenantId,
          studentId: dto.studentId,
          studentFeePlanId: plan.id,
          installmentNumber: i,
          title: `Installment ${i} of ${installmentsCount} (${structure.name})`,
          dueDate,
          amountPaise: installmentAmount,
          finePaise: 0,
          paidAmountPaise: 0,
          status: 'pending',
          paymentLinkId: `plink_${crypto.randomBytes(8).toString('hex')}`,
        })
        .returning();

      createdDues.push(due);
    }

    return {
      feePlan: plan,
      installmentsGenerated: createdDues.length,
      dues: createdDues,
    };
  }

  // -------------------------------------------------------------
  // PAYMENT COLLECTION & RECEIPTS (FEE-04, FEE-05)
  // -------------------------------------------------------------

  async collectPayment(
    tenantId: string,
    collectorUserId: string,
    dto: CollectPaymentDto
  ) {
    const db = this.dbService.getDb();

    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.instituteId, tenantId), eq(students.id, dto.studentId)));

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Generate unique sequential receipt number (FEE-05)
    const year = new Date().getFullYear();
    const existingPayments = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.instituteId, tenantId));
    const nextSeq = Number(existingPayments[0]?.count || 0) + 1;
    const receiptNo = `REC-${year}-${String(nextSeq).padStart(5, '0')}`;

    // Atomically create payment record
    const [payment] = await db
      .insert(payments)
      .values({
        instituteId: tenantId,
        studentId: dto.studentId,
        studentDueId: dto.studentDueId,
        receiptNo,
        amountPaidPaise: dto.amountPaidPaise,
        paymentMode: dto.paymentMode,
        referenceNo: dto.referenceNo,
        collectedBy: collectorUserId,
        status: 'success',
      })
      .returning();

    // Allocate payment against student due(s)
    let remainingPayment = dto.amountPaidPaise;

    let targetDuesQuery;
    if (dto.studentDueId) {
      targetDuesQuery = db
        .select()
        .from(studentDues)
        .where(
          and(
            eq(studentDues.instituteId, tenantId),
            eq(studentDues.id, dto.studentDueId)
          )
        );
    } else {
      targetDuesQuery = db
        .select()
        .from(studentDues)
        .where(
          and(
            eq(studentDues.instituteId, tenantId),
            eq(studentDues.studentId, dto.studentId),
            sql`${studentDues.status} IN ('pending', 'partial', 'overdue')`
          )
        )
        .orderBy(asc(studentDues.dueDate));
    }

    const targetDues = await targetDuesQuery;

    for (const due of targetDues) {
      if (remainingPayment <= 0) break;

      const outstanding = due.amountPaise + due.finePaise - due.paidAmountPaise;
      const paymentForThisDue = Math.min(remainingPayment, outstanding);
      const newPaidAmount = due.paidAmountPaise + paymentForThisDue;
      const isFullyPaid = newPaidAmount >= due.amountPaise + due.finePaise;

      await db
        .update(studentDues)
        .set({
          paidAmountPaise: newPaidAmount,
          status: isFullyPaid ? 'paid' : 'partial',
          updatedAt: new Date(),
        })
        .where(eq(studentDues.id, due.id));

      remainingPayment -= paymentForThisDue;
    }

    // Create official receipt (FEE-05)
    const [receipt] = await db
      .insert(receipts)
      .values({
        instituteId: tenantId,
        paymentId: payment.id,
        receiptNumber: receiptNo,
        isDuplicate: false,
        reprintCount: 0,
        issuedBy: collectorUserId,
      })
      .returning();

    // Trigger in-app notification to student/parent (COM-05)
    if (student.userId) {
      await db.insert(notifications).values({
        instituteId: tenantId,
        userId: student.userId,
        title: 'Fee Payment Received',
        message: `₹${(dto.amountPaidPaise / 100).toLocaleString('en-IN')} paid successfully via ${dto.paymentMode.toUpperCase()}. Receipt No: ${receiptNo}.`,
        type: 'general',
      });
    }

    return {
      payment,
      receipt,
      message: `Payment of ₹${(dto.amountPaidPaise / 100).toLocaleString('en-IN')} collected successfully`,
    };
  }

  async reprintReceipt(tenantId: string, receiptId: string, userId: string) {
    const db = this.dbService.getDb();

    const [receipt] = await db
      .select({
        id: receipts.id,
        receiptNumber: receipts.receiptNumber,
        isDuplicate: receipts.isDuplicate,
        reprintCount: receipts.reprintCount,
        issuedAt: receipts.issuedAt,
        amountPaidPaise: payments.amountPaidPaise,
        paymentMode: payments.paymentMode,
        referenceNo: payments.referenceNo,
        studentName: students.fullName,
        admissionNo: students.admissionNo,
      })
      .from(receipts)
      .leftJoin(payments, eq(receipts.paymentId, payments.id))
      .leftJoin(students, eq(payments.studentId, students.id))
      .where(and(eq(receipts.instituteId, tenantId), eq(receipts.id, receiptId)));

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    const nextCount = receipt.reprintCount + 1;

    await db
      .update(receipts)
      .set({
        isDuplicate: true,
        reprintCount: nextCount,
      })
      .where(eq(receipts.id, receiptId));

    return {
      ...receipt,
      isDuplicate: true,
      watermark: 'DUPLICATE',
      reprintCount: nextCount,
      reprintedAt: new Date(),
    };
  }

  // -------------------------------------------------------------
  // RAZORPAY WEBHOOK (FEE-06 - Idempotent)
  // -------------------------------------------------------------

  async processRazorpayWebhook(webhook: RazorpayWebhookDto, signatureHeader?: string) {
    const db = this.dbService.getDb();
    const paymentEntity = webhook.payload.payment?.entity;

    if (!paymentEntity) {
      return { status: 'ignored', reason: 'No payment entity' };
    }

    const razorpayPaymentId = paymentEntity.id;
    const notes = paymentEntity.notes || {};
    const tenantId = notes.instituteId;
    const studentDueId = notes.studentDueId;
    const studentId = notes.studentId;

    if (!tenantId || !studentId) {
      return { status: 'ignored', reason: 'Missing institute or student context' };
    }

    // IDEMPOTENCY CHECK (FEE-06): check if razorpayPaymentId already processed
    const [existing] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.instituteId, tenantId),
          eq(payments.razorpayPaymentId, razorpayPaymentId)
        )
      );

    if (existing) {
      return { status: 'already_processed', receiptNo: existing.receiptNo };
    }

    // Not processed yet: process payment
    const year = new Date().getFullYear();
    const existingPayments = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.instituteId, tenantId));
    const nextSeq = Number(existingPayments[0]?.count || 0) + 1;
    const receiptNo = `REC-RZP-${year}-${String(nextSeq).padStart(5, '0')}`;

    const [payment] = await db
      .insert(payments)
      .values({
        instituteId: tenantId,
        studentId,
        studentDueId,
        receiptNo,
        amountPaidPaise: paymentEntity.amount, // Razorpay passes amount in paise
        paymentMode: 'razorpay',
        referenceNo: razorpayPaymentId,
        razorpayPaymentId,
        razorpayOrderId: paymentEntity.order_id,
        razorpaySignature: signatureHeader,
        status: 'success',
      })
      .returning();

    if (studentDueId) {
      await db
        .update(studentDues)
        .set({
          paidAmountPaise: paymentEntity.amount,
          status: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(studentDues.id, studentDueId));
    }

    // Create receipt
    await db.insert(receipts).values({
      instituteId: tenantId,
      paymentId: payment.id,
      receiptNumber: receiptNo,
      isDuplicate: false,
    });

    return {
      status: 'processed',
      receiptNo,
      paymentId: payment.id,
    };
  }

  // -------------------------------------------------------------
  // DASHBOARD & LEDGERS (FEE-08, FEE-09, FEE-10)
  // -------------------------------------------------------------

  async getFeeDashboard(tenantId: string) {
    const db = this.dbService.getDb();
    const today = new Date().toISOString().slice(0, 10);
    const firstDayOfMonth = `${today.slice(0, 7)}-01`;

    // 1. Collected Today
    const todayRes = await db
      .select({ sum: sql<number>`COALESCE(SUM(amount_paid_paise), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.instituteId, tenantId),
          eq(payments.status, 'success'),
          sql`DATE(payment_date) = ${today}`
        )
      );

    // 2. Collected This Month
    const monthRes = await db
      .select({ sum: sql<number>`COALESCE(SUM(amount_paid_paise), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.instituteId, tenantId),
          eq(payments.status, 'success'),
          sql`DATE(payment_date) >= ${firstDayOfMonth}`
        )
      );

    // 3. Pending & Overdue Dues
    const duesRes = await db
      .select({
        totalPendingPaise: sql<number>`COALESCE(SUM(amount_paise + fine_paise - paid_amount_paise), 0)`,
        overdueCount: sql<number>`COUNT(CASE WHEN due_date < ${today} AND status != 'paid' THEN 1 END)`,
      })
      .from(studentDues)
      .where(
        and(
          eq(studentDues.instituteId, tenantId),
          sql`${studentDues.status} != 'paid'`
        )
      );

    // 4. Payment Mode Distribution
    const modeRes = await db
      .select({
        mode: payments.paymentMode,
        totalPaise: sql<number>`SUM(amount_paid_paise)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.instituteId, tenantId),
          eq(payments.status, 'success')
        )
      )
      .groupBy(payments.paymentMode);

    return {
      collectedTodayPaise: Number(todayRes[0]?.sum || 0),
      collectedThisMonthPaise: Number(monthRes[0]?.sum || 0),
      totalPendingPaise: Number(duesRes[0]?.totalPendingPaise || 0),
      overdueCount: Number(duesRes[0]?.overdueCount || 0),
      modeDistribution: modeRes,
    };
  }

  async getStudentLedger(tenantId: string, studentId: string) {
    const db = this.dbService.getDb();

    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.instituteId, tenantId), eq(students.id, studentId)));

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const plans = await db
      .select()
      .from(studentFeePlans)
      .where(
        and(
          eq(studentFeePlans.instituteId, tenantId),
          eq(studentFeePlans.studentId, studentId)
        )
      );

    const dues = await db
      .select()
      .from(studentDues)
      .where(
        and(
          eq(studentDues.instituteId, tenantId),
          eq(studentDues.studentId, studentId)
        )
      )
      .orderBy(asc(studentDues.dueDate));

    const paymentList = await db
      .select({
        id: payments.id,
        receiptNo: payments.receiptNo,
        amountPaidPaise: payments.amountPaidPaise,
        paymentMode: payments.paymentMode,
        paymentDate: payments.paymentDate,
        status: payments.status,
      })
      .from(payments)
      .where(
        and(
          eq(payments.instituteId, tenantId),
          eq(payments.studentId, studentId)
        )
      )
      .orderBy(desc(payments.paymentDate));

    const totalChargedPaise = dues.reduce((a, b) => a + b.amountPaise + b.finePaise, 0);
    const totalPaidPaise = paymentList.reduce((a, b) => a + b.amountPaidPaise, 0);
    const balancePaise = totalChargedPaise - totalPaidPaise;

    return {
      student,
      plans,
      dues,
      payments: paymentList,
      summary: {
        totalChargedPaise,
        totalPaidPaise,
        balancePaise,
      },
    };
  }

  async getDayEndReport(tenantId: string, dateStr: string) {
    const db = this.dbService.getDb();

    const report = await db
      .select({
        mode: payments.paymentMode,
        totalPaise: sql<number>`SUM(amount_paid_paise)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.instituteId, tenantId),
          eq(payments.status, 'success'),
          sql`DATE(payment_date) = ${dateStr}`
        )
      )
      .groupBy(payments.paymentMode);

    const totalPaise = report.reduce((acc, row) => acc + Number(row.totalPaise), 0);

    return {
      date: dateStr,
      totalPaise,
      breakdown: report,
    };
  }

  // -------------------------------------------------------------
  // FEE REMINDERS & WALLET (REM-01..08, CTL-09)
  // -------------------------------------------------------------

  async sendReminder(tenantId: string, dueId: string, channel: 'whatsapp' | 'sms' = 'whatsapp') {
    const db = this.dbService.getDb();

    // 1. Check Message Wallet Credits (CTL-09, REM-06)
    const [wallet] = await db
      .select()
      .from(messageWallets)
      .where(eq(messageWallets.instituteId, tenantId));

    if (!wallet || wallet.creditsBalance <= 0) {
      throw new BadRequestException(
        'Insufficient message wallet credits (REM-06). Please top up via Control Center.'
      );
    }

    const [due] = await db
      .select({
        id: studentDues.id,
        studentId: studentDues.studentId,
        title: studentDues.title,
        dueDate: studentDues.dueDate,
        amountPaise: studentDues.amountPaise,
        paidAmountPaise: studentDues.paidAmountPaise,
        status: studentDues.status,
        studentName: students.fullName,
        parentPhone: students.parentPhone,
        userId: students.userId,
      })
      .from(studentDues)
      .leftJoin(students, eq(studentDues.studentId, students.id))
      .where(and(eq(studentDues.instituteId, tenantId), eq(studentDues.id, dueId)));

    if (!due) {
      throw new NotFoundException('Due record not found');
    }

    const balancePaise = due.amountPaise - due.paidAmountPaise;
    const msg = `Dear Parent, reminder: fee due of ₹${(balancePaise / 100).toLocaleString('en-IN')} for ${due.studentName} (${due.title}) is due on ${due.dueDate}. Pay online: https://pay.classo.in/due/${due.id}`;

    // Deduct 1 credit from message wallet (CTL-09)
    await db
      .update(messageWallets)
      .set({
        creditsBalance: wallet.creditsBalance - 1,
        updatedAt: new Date(),
      })
      .where(eq(messageWallets.id, wallet.id));

    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      instituteId: tenantId,
      amountCredits: 1,
      type: 'debit',
      description: `Fee Reminder dispatch (${channel}) for ${due.studentName}`,
      referenceId: due.id,
    });

    // Insert reminder log (REM-05)
    const [log] = await db
      .insert(reminderLogs)
      .values({
        instituteId: tenantId,
        studentDueId: due.id,
        studentId: due.studentId,
        channel,
        recipientPhone: due.parentPhone,
        messageText: msg,
        status: 'sent',
        costCredits: 1,
      })
      .returning();

    // Trigger in-app notification (COM-05)
    if (due.userId) {
      await db.insert(notifications).values({
        instituteId: tenantId,
        userId: due.userId,
        title: 'Fee Due Reminder',
        message: msg,
        type: 'reminder',
        link: `/fees`,
      });
    }

    return {
      message: 'Fee reminder sent successfully',
      remainingCredits: wallet.creditsBalance - 1,
      log,
    };
  }
}
