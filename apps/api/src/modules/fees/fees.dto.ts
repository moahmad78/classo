export class CreateFeeHeadDto {
  name!: string;
  code!: string;
  description?: string;
  isRefundable?: boolean;
}

export class CreateFeeStructureDto {
  academicYearId?: string;
  classId!: string;
  name!: string;
  items!: Array<{
    feeHeadId: string;
    amountPaise: number;
  }>;
}

export class AssignStudentFeePlanDto {
  studentId!: string;
  academicYearId?: string;
  feeStructureId!: string;
  planType!: 'one_time' | 'monthly' | 'quarterly' | 'custom';
  discountPaise?: number;
  discountReason?: string;
  startDate?: string; // YYYY-MM-DD
}

export class CollectPaymentDto {
  studentId!: string;
  studentDueId?: string;
  amountPaidPaise!: number;
  paymentMode!: 'cash' | 'cheque' | 'upi' | 'card' | 'bank_transfer' | 'razorpay';
  referenceNo?: string;
  notes?: string;
}

export class RazorpayWebhookDto {
  event!: string; // 'payment.captured' | 'payment_link.paid'
  payload!: {
    payment?: {
      entity?: {
        id: string;
        order_id?: string;
        amount: number;
        status: string;
        notes?: {
          instituteId?: string;
          studentDueId?: string;
          studentId?: string;
        };
      };
    };
  };
}

export class SendReminderNowDto {
  studentDueId!: string;
  channel?: 'whatsapp' | 'sms' | 'email';
}
