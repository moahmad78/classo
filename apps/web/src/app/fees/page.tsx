'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from '@classo/ui';

interface FeeDueItem {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  title: string;
  dueDate: string;
  amountRupees: number;
  paidRupees: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  parentPhone: string;
}

interface FeeStructureItem {
  id: string;
  className: string;
  name: string;
  totalAnnualRupees: number;
  breakdown: Array<{ head: string; amount: number }>;
}

interface ReceiptData {
  receiptNo: string;
  studentName: string;
  admissionNo: string;
  className: string;
  amountRupees: number;
  paymentMode: string;
  referenceNo?: string;
  date: string;
  isDuplicate: boolean;
  reprintCount: number;
}

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState<'collection' | 'dues' | 'structures' | 'closing'>('collection');

  // Stats
  const [todayCollected, setTodayCollected] = useState(64500);
  const [monthCollected, setMonthCollected] = useState(842000);
  const [walletCredits, setWalletCredits] = useState(492); // Message wallet (CTL-09)

  // Dues state
  const [duesList, setDuesList] = useState<FeeDueItem[]>([
    {
      id: 'due-1',
      studentId: 's1',
      studentName: 'Aarav Mehta',
      admissionNo: 'ADM-2026-0001',
      className: 'Class 10 - Section A',
      title: 'Quarter 2 Tuition & Lab Fee',
      dueDate: '2026-10-10',
      amountRupees: 12500,
      paidRupees: 0,
      status: 'pending',
      parentPhone: '+91 98765 00111',
    },
    {
      id: 'due-2',
      studentId: 's2',
      studentName: 'Ananya Gupta',
      admissionNo: 'ADM-2026-0002',
      className: 'Class 10 - Section A',
      title: 'Quarter 1 Tuition Fee',
      dueDate: '2026-09-10',
      amountRupees: 11000,
      paidRupees: 6000,
      status: 'overdue',
      parentPhone: '+91 98112 23344',
    },
    {
      id: 'due-3',
      studentId: 's3',
      studentName: 'Devansh Verma',
      admissionNo: 'ADM-2026-0003',
      className: 'Class 10 - Section B',
      title: 'Quarter 2 Tuition Fee',
      dueDate: '2026-10-10',
      amountRupees: 11000,
      paidRupees: 0,
      status: 'pending',
      parentPhone: '+91 98223 34455',
    },
    {
      id: 'due-4',
      studentId: 's4',
      studentName: 'Ishaan Sharma',
      admissionNo: 'ADM-2026-0004',
      className: 'Class 9 - Section A',
      title: 'Quarter 1 Tuition & Transport',
      dueDate: '2026-08-10',
      amountRupees: 14500,
      paidRupees: 0,
      status: 'overdue',
      parentPhone: '+91 98334 45566',
    },
    {
      id: 'due-5',
      studentId: 's5',
      studentName: 'Kavya Nair',
      admissionNo: 'ADM-2026-0005',
      className: 'Class 9 - Section A',
      title: 'Quarter 1 Tuition Fee',
      dueDate: '2026-09-10',
      amountRupees: 10000,
      paidRupees: 10000,
      status: 'paid',
      parentPhone: '+91 98445 56677',
    },
  ]);

  // Fee Structures
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([
    {
      id: 'fs-1',
      className: 'Class 10',
      name: 'Class 10 General Academic Fee 2026-27',
      totalAnnualRupees: 48000,
      breakdown: [
        { head: 'Tuition Fee', amount: 36000 },
        { head: 'Science Lab Fee', amount: 6000 },
        { head: 'Examination Fee', amount: 4000 },
        { head: 'Computer & Library', amount: 2000 },
      ],
    },
    {
      id: 'fs-2',
      className: 'Class 9',
      name: 'Class 9 General Academic Fee 2026-27',
      totalAnnualRupees: 42000,
      breakdown: [
        { head: 'Tuition Fee', amount: 32000 },
        { head: 'Science Lab Fee', amount: 4000 },
        { head: 'Examination Fee', amount: 4000 },
        { head: 'Computer & Library', amount: 2000 },
      ],
    },
  ]);

  // Collection modal state
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectStudent, setCollectStudent] = useState('Aarav Mehta');
  const [collectAmount, setCollectAmount] = useState('12500');
  const [collectMode, setCollectMode] = useState<'cash' | 'upi' | 'cheque' | 'card' | 'razorpay'>('upi');
  const [collectRef, setCollectRef] = useState('UPI-90412847291');
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Reminder alert message
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const handleCollectPayment = () => {
    const amt = Number(collectAmount) || 0;
    const recNo = `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const receipt: ReceiptData = {
      receiptNo: recNo,
      studentName: collectStudent,
      admissionNo: 'ADM-2026-0001',
      className: 'Class 10 - Section A',
      amountRupees: amt,
      paymentMode: collectMode.toUpperCase(),
      referenceNo: collectRef || undefined,
      date: new Date().toLocaleDateString('en-IN'),
      isDuplicate: false,
      reprintCount: 0,
    };

    // Update dues
    setDuesList((prev) =>
      prev.map((d) =>
        d.studentName === collectStudent
          ? { ...d, paidRupees: d.paidRupees + amt, status: 'paid' }
          : d
      )
    );

    setTodayCollected((prev) => prev + amt);
    setMonthCollected((prev) => prev + amt);
    setShowCollectModal(false);
    setActiveReceipt(receipt);
  };

  const handleReprintReceipt = () => {
    if (!activeReceipt) return;
    setActiveReceipt({
      ...activeReceipt,
      isDuplicate: true,
      reprintCount: activeReceipt.reprintCount + 1,
    });
  };

  const handleSendReminder = (due: FeeDueItem) => {
    if (walletCredits <= 0) {
      alert('Insufficient message wallet credits (REM-06). Please top up via Control Center.');
      return;
    }

    setWalletCredits((prev) => prev - 1);
    setReminderToast(
      `WhatsApp fee reminder dispatched to ${due.parentPhone} for ${due.studentName} (Remaining balance: ₹${(
        due.amountRupees - due.paidRupees
      ).toLocaleString('en-IN')}). 1 wallet credit deducted.`
    );
    setTimeout(() => setReminderToast(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E0D8] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#115E59] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-[#0F766E]">Classo</span>
                <span className="text-xs bg-[#FAF7F2] text-[#0F766E] border border-[#0F766E]/20 px-2 py-0.5 rounded-full font-medium">
                  Fee Accounts & Cashier
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Fee Ledger, Collection & Razorpay Integration</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-[#FAF7F2] border border-[#E5E0D8] px-3 py-1.5 rounded-xl text-xs">
              <span className="text-[#6B7280]">Message Wallet (CTL-09):</span>
              <span className="font-bold text-[#0F766E]">{walletCredits} Credits</span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCollectModal(true)}
            >
              💳 Collect Payment (FEE-04)
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'collection'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              💰 Collection & Dashboard (FEE-08)
            </button>
            <button
              onClick={() => setActiveTab('dues')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
                activeTab === 'dues'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              <span>📋 Dues & Defaulters (REM-01..08)</span>
              <span className="bg-[#B91C1C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {duesList.filter((d) => d.status === 'overdue').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('structures')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'structures'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              📐 Fee Structures & Heads (FEE-01)
            </button>
            <button
              onClick={() => setActiveTab('closing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'closing'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              📑 Day-End Closing (FEE-10)
            </button>
          </div>
        </div>

        {/* Reminder Toast */}
        {reminderToast && (
          <div className="bg-[#15803D]/10 border border-[#15803D]/20 text-[#15803D] px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span>{reminderToast}</span>
            <button
              onClick={() => setReminderToast(null)}
              className="text-[#15803D] hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 1: COLLECTION DASHBOARD                                   */}
        {/* ============================================================= */}
        {activeTab === 'collection' && (
          <div className="space-y-6">
            {/* Financial Overview Metrics (FEE-08) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 border-l-4 border-l-[#15803D]">
                <p className="text-xs text-[#6B7280] font-semibold">Collected Today</p>
                <p className="text-2xl font-bold text-[#15803D] mt-1">
                  ₹{todayCollected.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1">7 transactions settled</p>
              </Card>

              <Card className="p-4 border-l-4 border-l-[#0F766E]">
                <p className="text-xs text-[#6B7280] font-semibold">Collected This Month</p>
                <p className="text-2xl font-bold text-[#0F766E] mt-1">
                  ₹{monthCollected.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1">October 2026</p>
              </Card>

              <Card className="p-4 border-l-4 border-l-[#B91C1C]">
                <p className="text-xs text-[#6B7280] font-semibold">Overdue Dues</p>
                <p className="text-2xl font-bold text-[#B91C1C] mt-1">
                  ₹36,500
                </p>
                <p className="text-[11px] text-[#B91C1C] mt-1">
                  {duesList.filter((d) => d.status === 'overdue').length} students flagged
                </p>
              </Card>

              <Card className="p-4 border-l-4 border-l-[#F59E0B]">
                <p className="text-xs text-[#6B7280] font-semibold">Upcoming Due (10 Oct)</p>
                <p className="text-2xl font-bold text-[#B45309] mt-1">
                  ₹1,45,000
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1">Quarter 2 installment</p>
              </Card>
            </div>

            {/* Mode-wise distribution cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8] text-center">
                <p className="text-xs text-[#6B7280]">UPI / QR</p>
                <p className="text-base font-bold text-[#1F2937] mt-0.5">₹42,500 (66%)</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8] text-center">
                <p className="text-xs text-[#6B7280]">Cash Collection</p>
                <p className="text-base font-bold text-[#1F2937] mt-0.5">₹14,000 (22%)</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8] text-center">
                <p className="text-xs text-[#6B7280]">Razorpay Online (FEE-06)</p>
                <p className="text-base font-bold text-[#1F2937] mt-0.5">₹8,000 (12%)</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-[#E5E0D8] text-center">
                <p className="text-xs text-[#6B7280]">Cheque / DD</p>
                <p className="text-base font-bold text-[#1F2937] mt-0.5">₹0 (0%)</p>
              </div>
            </div>

            {/* Recent Payments Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-[#E5E0D8] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">Today's Fee Receipts (FEE-05)</h3>
                  <p className="text-xs text-[#6B7280]">Sequential receipt numbering & atomic ledger allocation</p>
                </div>
                <Badge variant="primary">Today: 2026-10-03</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#6B7280] font-semibold border-b border-[#E5E0D8]">
                    <tr>
                      <th className="py-3 px-4">Receipt No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Reference No</th>
                      <th className="py-3 px-4 text-right">Receipt Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    <tr className="hover:bg-[#FAF7F2]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">REC-2026-00041</td>
                      <td className="py-3 px-4 font-bold text-[#1F2937]">Kavya Nair</td>
                      <td className="py-3 px-4 text-[#6B7280]">Class 9 - Section A</td>
                      <td className="py-3 px-4 font-bold text-[#15803D]">₹10,000</td>
                      <td className="py-3 px-4"><Badge variant="primary">UPI</Badge></td>
                      <td className="py-3 px-4 font-mono text-[#6B7280]">UPI-908129381</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setActiveReceipt({
                              receiptNo: 'REC-2026-00041',
                              studentName: 'Kavya Nair',
                              admissionNo: 'ADM-2026-0005',
                              className: 'Class 9 - Section A',
                              amountRupees: 10000,
                              paymentMode: 'UPI',
                              referenceNo: 'UPI-908129381',
                              date: '03/10/2026',
                              isDuplicate: false,
                              reprintCount: 0,
                            })
                          }
                          className="text-xs font-semibold text-[#0F766E] hover:underline"
                        >
                          View / Print Receipt
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#FAF7F2]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">REC-2026-00040</td>
                      <td className="py-3 px-4 font-bold text-[#1F2937]">Rohan Joshi</td>
                      <td className="py-3 px-4 text-[#6B7280]">Class 10 - Section B</td>
                      <td className="py-3 px-4 font-bold text-[#15803D]">₹14,500</td>
                      <td className="py-3 px-4"><Badge variant="neutral">Cash</Badge></td>
                      <td className="py-3 px-4 font-mono text-[#6B7280]">Cashier Desk 1</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setActiveReceipt({
                              receiptNo: 'REC-2026-00040',
                              studentName: 'Rohan Joshi',
                              admissionNo: 'ADM-2026-0006',
                              className: 'Class 10 - Section B',
                              amountRupees: 14500,
                              paymentMode: 'Cash',
                              date: '03/10/2026',
                              isDuplicate: false,
                              reprintCount: 0,
                            })
                          }
                          className="text-xs font-semibold text-[#0F766E] hover:underline"
                        >
                          View / Print Receipt
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: DUES & DEFAULTERS (REM-01..08)                         */}
        {/* ============================================================= */}
        {activeTab === 'dues' && (
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">Student Fee Dues & Reminder Engine</h3>
                <p className="text-xs text-[#6B7280]">
                  Automated offset rules (-3d, 0d, +1d, +3d, +7d) and 1-click manual WhatsApp reminders
                </p>
              </div>
              <Badge variant="primary">{walletCredits} Message Credits Available</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#6B7280] font-semibold border-b border-[#E5E0D8]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Installment Title</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Due Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Reminder Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]">
                  {duesList.map((due) => (
                    <tr key={due.id} className="hover:bg-[#FAF7F2]/50">
                      <td className="py-3 px-4 font-bold text-[#1F2937]">{due.studentName}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{due.admissionNo}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{due.className}</td>
                      <td className="py-3 px-4 text-[#1F2937]">{due.title}</td>
                      <td className="py-3 px-4 font-mono">{due.dueDate}</td>
                      <td className="py-3 px-4 font-bold text-[#1F2937]">
                        ₹{(due.amountRupees - due.paidRupees).toLocaleString('en-IN')}
                        {due.paidRupees > 0 && (
                          <span className="text-[10px] text-[#6B7280] block font-normal">
                            (Paid: ₹{due.paidRupees.toLocaleString('en-IN')})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            due.status === 'paid'
                              ? 'success'
                              : due.status === 'overdue'
                              ? 'danger'
                              : due.status === 'partial'
                              ? 'warning'
                              : 'primary'
                          }
                        >
                          {due.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {due.status !== 'paid' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(due)}
                          >
                            📲 Send WhatsApp Reminder (REM-07)
                          </Button>
                        ) : (
                          <span className="text-xs text-[#15803D] font-semibold">Cleared</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ============================================================= */}
        {/* TAB 3: FEE STRUCTURES (FEE-01, FEE-02)                        */}
        {/* ============================================================= */}
        {activeTab === 'structures' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feeStructures.map((struct) => (
              <Card key={struct.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="bg-[#FAF7F2] text-[#0F766E] border border-[#0F766E]/20 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {struct.className}
                  </span>
                  <Badge variant="primary">Annual Total: ₹{struct.totalAnnualRupees.toLocaleString('en-IN')}</Badge>
                </div>

                <h4 className="text-base font-bold text-[#1F2937]">{struct.name}</h4>

                <div className="bg-[#FAF7F2] p-4 rounded-xl space-y-2 border border-[#E5E0D8]">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Itemized Heads (FEE-01)</p>
                  {struct.breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-[#1F2937]">{item.head}</span>
                      <span className="font-bold text-[#0F766E]">₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between text-xs font-bold text-[#1F2937]">
                    <span>Total Annual Fee</span>
                    <span className="text-[#15803D]">₹{struct.totalAnnualRupees.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>Installments supported: Quarterly (4x), Monthly (10x), One-Time</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: DAY-END CLOSING (FEE-10)                               */}
        {/* ============================================================= */}
        {activeTab === 'closing' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Accountant Day-End Closing Report (FEE-10)</h3>
                <p className="text-xs text-[#6B7280]">Daily reconciliation across all cashier counters and payment gateways</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                🖨️ Export Closing PDF
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
                <p className="text-xs text-[#6B7280]">Date of Closing</p>
                <p className="text-lg font-bold text-[#1F2937] mt-1">03 October 2026</p>
              </div>
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
                <p className="text-xs text-[#6B7280]">Total Collections</p>
                <p className="text-lg font-bold text-[#15803D] mt-1">₹{todayCollected.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
                <p className="text-xs text-[#6B7280]">Cash in Vault</p>
                <p className="text-lg font-bold text-[#0F766E] mt-1">₹14,000</p>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-[#1F2937]">Accountant Verification Sign-off</h4>
              <p className="text-[#6B7280]">
                "All bank transfers, UPI transactions, and physical cash receipts have been matched
                against ledger serial numbers. No missing receipts or discrepancies detected."
              </p>
              <div className="pt-2 flex items-center justify-between text-[#6B7280]">
                <span>Verified by: <strong>Ramesh Verma (Chief Accountant)</strong></span>
                <span>Time: 05:45 PM IST</span>
              </div>
            </div>
          </Card>
        )}
      </main>

      {/* Collect Payment Modal (FEE-04) */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-[#1F2937]">Collect Fee Payment</h3>
            <p className="text-xs text-[#6B7280]">
              Atomic ledger entry with instant sequential receipt generation
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Select Student</label>
                <select
                  value={collectStudent}
                  onChange={(e) => setCollectStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs font-semibold"
                >
                  <option value="Aarav Mehta">Aarav Mehta (Class 10 - Section A)</option>
                  <option value="Ananya Gupta">Ananya Gupta (Class 10 - Section A)</option>
                  <option value="Devansh Verma">Devansh Verma (Class 10 - Section B)</option>
                  <option value="Ishaan Sharma">Ishaan Sharma (Class 9 - Section A)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Amount to Collect (₹)</label>
                <Input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Payment Mode</label>
                <select
                  value={collectMode}
                  onChange={(e) => setCollectMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs font-semibold"
                >
                  <option value="upi">UPI / Dynamic QR</option>
                  <option value="cash">Cash Counter</option>
                  <option value="card">Debit / Credit Card (POS)</option>
                  <option value="cheque">Cheque / Demand Draft</option>
                  <option value="razorpay">Razorpay Payment Link (FEE-06)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Reference / UTR / Cheque No</label>
                <Input
                  placeholder="e.g. UPI Transaction ID or Bank Ref"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E0D8]">
              <Button variant="outline" size="sm" onClick={() => setShowCollectModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCollectPayment}>
                Issue Receipt & Settle
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Official Receipt Modal (FEE-05) */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-8 space-y-6 bg-white relative animate-scaleUp">
            {/* Watermark if duplicate reprint */}
            {activeReceipt.isDuplicate && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <span className="text-8xl font-black text-[#B91C1C] rotate-[-30deg]">
                  DUPLICATE
                </span>
              </div>
            )}

            {/* Receipt Header */}
            <div className="text-center border-b border-[#E5E0D8] pb-4 space-y-1">
              <h2 className="text-xl font-bold text-[#0F766E]">DELHI PUBLIC ACADEMY</h2>
              <p className="text-xs text-[#6B7280]">Plot 14, Institutional Area, New Delhi - 110001</p>
              <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mt-2">
                OFFICIAL FEE RECEIPT
              </p>
              {activeReceipt.isDuplicate && (
                <Badge variant="danger" className="mt-1">
                  REPRINT COPY (DUPLICATE #{activeReceipt.reprintCount})
                </Badge>
              )}
            </div>

            {/* Receipt Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6B7280]">Receipt Number:</span>
                <p className="font-mono font-bold text-[#0F766E]">{activeReceipt.receiptNo}</p>
              </div>
              <div className="text-right">
                <span className="text-[#6B7280]">Date & Time:</span>
                <p className="font-semibold text-[#1F2937]">{activeReceipt.date}</p>
              </div>
              <div>
                <span className="text-[#6B7280]">Student Name:</span>
                <p className="font-bold text-[#1F2937]">{activeReceipt.studentName}</p>
              </div>
              <div className="text-right">
                <span className="text-[#6B7280]">Admission Number:</span>
                <p className="font-mono text-[#1F2937]">{activeReceipt.admissionNo}</p>
              </div>
            </div>

            {/* Itemized Settle Table */}
            <div className="border border-[#E5E0D8] rounded-xl overflow-hidden text-xs">
              <div className="bg-[#FAF7F2] p-2.5 font-bold flex items-center justify-between text-[#6B7280]">
                <span>Particulars</span>
                <span>Amount Paid</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Quarterly Tuition & Academic Fees</span>
                  <span className="font-mono">₹{activeReceipt.amountRupees.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between font-bold text-[#15803D]">
                  <span>Total Amount Paid</span>
                  <span>₹{activeReceipt.amountRupees.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-[#6B7280] space-y-1">
              <p>• <strong>Payment Mode:</strong> {activeReceipt.paymentMode}</p>
              {activeReceipt.referenceNo && (
                <p>• <strong>Reference No:</strong> {activeReceipt.referenceNo}</p>
              )}
              <p>• Computer-generated receipt authorized by Classo Secure Ledger.</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D8]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprintReceipt}
              >
                🖨️ Reprint as DUPLICATE (FEE-05)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveReceipt(null)}
              >
                Close Receipt
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
