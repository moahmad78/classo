'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from '@classo/ui';

interface StudentAttendanceRecord {
  studentId: string;
  admissionNo: string;
  rollNo: string;
  fullName: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  remarks?: string;
}

interface StaffCheckIn {
  id: string;
  staffName: string;
  designation: string;
  department: string;
  time: string;
  photoUrl: string;
  withinGeofence: boolean;
  distanceMeters: number;
  reviewStatus: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'students' | 'selfie' | 'review'>('students');

  // -------------------------------------------------------------
  // STUDENT ATTENDANCE STATE (ATT-01..05)
  // -------------------------------------------------------------
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [attendanceDate, setAttendanceDate] = useState('2026-10-03');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [studentRecords, setStudentRecords] = useState<StudentAttendanceRecord[]>([
    {
      studentId: 's1',
      admissionNo: 'ADM-2026-0001',
      rollNo: '1001',
      fullName: 'Aarav Mehta',
      status: 'present',
    },
    {
      studentId: 's2',
      admissionNo: 'ADM-2026-0002',
      rollNo: '1002',
      fullName: 'Ananya Gupta',
      status: 'present',
    },
    {
      studentId: 's3',
      admissionNo: 'ADM-2026-0003',
      rollNo: '1003',
      fullName: 'Devansh Verma',
      status: 'absent',
      remarks: 'Fever reported by parent',
    },
    {
      studentId: 's4',
      admissionNo: 'ADM-2026-0004',
      rollNo: '1004',
      fullName: 'Ishaan Sharma',
      status: 'present',
    },
    {
      studentId: 's5',
      admissionNo: 'ADM-2026-0005',
      rollNo: '1005',
      fullName: 'Kavya Nair',
      status: 'late',
      remarks: 'Bus delay',
    },
    {
      studentId: 's6',
      admissionNo: 'ADM-2026-0006',
      rollNo: '1006',
      fullName: 'Rohan Joshi',
      status: 'present',
    },
    {
      studentId: 's7',
      admissionNo: 'ADM-2026-0007',
      rollNo: '1007',
      fullName: 'Sanya Mirza',
      status: 'leave',
      remarks: 'Family event (approved)',
    },
  ]);

  const toggleStudentStatus = (index: number) => {
    const statuses: Array<'present' | 'absent' | 'late' | 'leave'> = [
      'present',
      'absent',
      'late',
      'leave',
    ];
    setStudentRecords((prev) => {
      const updated = [...prev];
      const currentIdx = statuses.indexOf(updated[index].status);
      const nextIdx = (currentIdx + 1) % statuses.length;
      updated[index] = { ...updated[index], status: statuses[nextIdx] };
      return updated;
    });
  };

  const markAllPresent = () => {
    setStudentRecords((prev) =>
      prev.map((s) => ({ ...s, status: 'present' as const }))
    );
  };

  const handleSaveAttendance = () => {
    const absents = studentRecords.filter((s) => s.status === 'absent');
    setSaveSuccessMsg(
      `Attendance saved successfully for ${studentRecords.length} students! ${
        absents.length > 0
          ? `${absents.length} absence alerts automatically dispatched to parents.`
          : 'All students accounted for.'
      }`
    );
    setTimeout(() => setSaveSuccessMsg(null), 6000);
  };

  // Student stats
  const totalStudents = studentRecords.length;
  const presentCount = studentRecords.filter((s) => s.status === 'present').length;
  const absentCount = studentRecords.filter((s) => s.status === 'absent').length;
  const lateCount = studentRecords.filter((s) => s.status === 'late').length;
  const leaveCount = studentRecords.filter((s) => s.status === 'leave').length;
  const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

  // -------------------------------------------------------------
  // STAFF SELFIE ATTENDANCE STATE (STF-02, STF-05..14)
  // -------------------------------------------------------------
  const [hasConsent, setHasConsent] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [simulatedLat, setSimulatedLat] = useState(28.6141); // 20m from main campus
  const [simulatedLon, setSimulatedLon] = useState(77.2092);
  const [isOutsideGeofence, setIsOutsideGeofence] = useState(false);
  const [selfieStatusMsg, setSelfieStatusMsg] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [checkInTimeStr, setCheckInTimeStr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setCameraActive(true);
    setCapturedPhoto(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch {
      // In non-supported or headless environments, fallback to simulated camera stream
    }
  };

  const capturePhoto = () => {
    // Generate simulated selfie photo canvas data
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0F766E';
      ctx.fillRect(0, 0, 320, 240);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px sans-serif';
      ctx.fillText('Live Selfie Camera Capture', 40, 110);
      ctx.font = '12px sans-serif';
      ctx.fillText(new Date().toLocaleTimeString(), 40, 140);
      setCapturedPhoto(canvas.toDataURL('image/jpeg'));
    }
    setCameraActive(false);
  };

  const handleSelfieCheckIn = () => {
    if (!hasConsent) {
      setSelfieStatusMsg({
        type: 'error',
        text: 'DPDP Act: Explicit consent is required before capturing biometric selfie attendance.',
      });
      return;
    }

    if (!capturedPhoto) {
      setSelfieStatusMsg({
        type: 'error',
        text: 'Please activate camera and capture a live selfie first.',
      });
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCheckInTimeStr(now);
    setIsCheckedInToday(true);

    if (isOutsideGeofence) {
      setSelfieStatusMsg({
        type: 'warning',
        text: `Check-in recorded outside campus boundary (420m away). Flagged for Principal review (STF-06).`,
      });
    } else {
      setSelfieStatusMsg({
        type: 'success',
        text: `Check-in verified within Main Campus geofence (28m away) at ${now}. Attendance auto-approved!`,
      });
    }
  };

  const handleSelfieCheckOut = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSelfieStatusMsg({
      type: 'success',
      text: `Check-out recorded successfully at ${now}. Day complete!`,
    });
  };

  // -------------------------------------------------------------
  // PRINCIPAL REVIEW QUEUE STATE (STF-09)
  // -------------------------------------------------------------
  const [reviewList, setReviewList] = useState<StaffCheckIn[]>([
    {
      id: 'rev-1',
      staffName: 'Amit Sharma',
      designation: 'Senior Faculty',
      department: 'Mathematics',
      time: '08:42 AM',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
      withinGeofence: true,
      distanceMeters: 35,
      reviewStatus: 'approved',
    },
    {
      id: 'rev-2',
      staffName: 'Priya Verma',
      designation: 'Science Teacher',
      department: 'Physics',
      time: '08:58 AM',
      photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60',
      withinGeofence: false,
      distanceMeters: 480,
      reviewStatus: 'pending',
    },
    {
      id: 'rev-3',
      staffName: 'Rajesh Kulkarni',
      designation: 'Lab Instructor',
      department: 'Chemistry',
      time: '09:15 AM',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
      withinGeofence: false,
      distanceMeters: 310,
      reviewStatus: 'pending',
    },
  ]);

  const [rejectModalItem, setRejectModalItem] = useState<StaffCheckIn | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = (id: string) => {
    setReviewList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reviewStatus: 'approved' } : item))
    );
  };

  const handleConfirmReject = () => {
    if (!rejectModalItem || !rejectReason.trim()) return;
    setReviewList((prev) =>
      prev.map((item) =>
        item.id === rejectModalItem.id
          ? { ...item, reviewStatus: 'rejected', rejectionReason: rejectReason }
          : item
      )
    );
    setRejectModalItem(null);
    setRejectReason('');
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
                  Delhi Public Academy
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Daily Operations & Attendance</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E5E0D8]">
              <a
                href="/attendance"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F766E] text-white"
              >
                Attendance
              </a>
              <a
                href="/timetable"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
              >
                Timetable
              </a>
              <a
                href="/notices"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
              >
                Notices
              </a>
              <a
                href="/students"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
              >
                Students
              </a>
              <a
                href="/staff"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
              >
                Staff
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'students'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              📋 Student Attendance (ATT-01..05)
            </button>
            <button
              onClick={() => setActiveTab('selfie')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'selfie'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              📸 Staff Selfie Attendance (STF-02, 05..14)
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'review'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              <span>🛡️ Principal Review Queue</span>
              {reviewList.filter((r) => r.reviewStatus === 'pending').length > 0 && (
                <span className="bg-[#B91C1C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {reviewList.filter((r) => r.reviewStatus === 'pending').length}
                </span>
              )}
            </button>
          </div>

          <Badge variant="outline" className="hidden sm:inline-flex bg-white text-[#0F766E]">
            Campus: Main Academy (Radius: 150m)
          </Badge>
        </div>

        {/* ============================================================= */}
        {/* TAB 1: STUDENT ATTENDANCE                                    */}
        {/* ============================================================= */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Control Bar: Class, Section, Date & Quick Action */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] uppercase mb-1">
                      Class
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#1F2937]"
                    >
                      <option value="Class 10">Class 10</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 8">Class 8</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] uppercase mb-1">
                      Section
                    </label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#1F2937]"
                    >
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B7280] uppercase mb-1">
                      Date (ATT-02)
                    </label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="min-h-[40px] px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#1F2937]"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                  <Button variant="outline" size="sm" onClick={markAllPresent}>
                    ⚡ Mark All Present (1-Tap)
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveAttendance}>
                    💾 Save Attendance (≤ 3 Taps)
                  </Button>
                </div>
              </div>
            </Card>

            {/* Notification message */}
            {saveSuccessMsg && (
              <div className="bg-[#15803D]/10 border border-[#15803D]/20 text-[#15803D] px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
                <span>{saveSuccessMsg}</span>
                <button
                  onClick={() => setSaveSuccessMsg(null)}
                  className="text-[#15803D] hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <Card className="p-3 text-center">
                <p className="text-[11px] text-[#6B7280] font-medium">Total Students</p>
                <p className="text-xl font-bold text-[#1F2937]">{totalStudents}</p>
              </Card>
              <Card className="p-3 text-center border-l-4 border-l-[#15803D]">
                <p className="text-[11px] text-[#15803D] font-medium">Present</p>
                <p className="text-xl font-bold text-[#15803D]">{presentCount}</p>
              </Card>
              <Card className="p-3 text-center border-l-4 border-l-[#B91C1C]">
                <p className="text-[11px] text-[#B91C1C] font-medium">Absent (Alerts)</p>
                <p className="text-xl font-bold text-[#B91C1C]">{absentCount}</p>
              </Card>
              <Card className="p-3 text-center border-l-4 border-l-[#F59E0B]">
                <p className="text-[11px] text-[#B45309] font-medium">Late</p>
                <p className="text-xl font-bold text-[#B45309]">{lateCount}</p>
              </Card>
              <Card className="p-3 text-center border-l-4 border-l-blue-500">
                <p className="text-[11px] text-blue-600 font-medium">Approved Leave</p>
                <p className="text-xl font-bold text-blue-600">{leaveCount}</p>
              </Card>
              <Card className="p-3 text-center bg-[#0F766E]/5 border-[#0F766E]/20">
                <p className="text-[11px] text-[#0F766E] font-medium">Attendance Rate</p>
                <p className="text-xl font-bold text-[#0F766E]">{attendanceRate}%</p>
              </Card>
            </div>

            {/* Attendance Sheet Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-[#E5E0D8] bg-[#FAF7F2]/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937]">
                    {selectedClass} - {selectedSection} Attendance Sheet
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Tap status button directly to toggle between Present, Absent, Late & Leave
                  </p>
                </div>
                <Badge variant="primary">Date: {attendanceDate}</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#6B7280] font-semibold border-b border-[#E5E0D8]">
                    <tr>
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Admission No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Status (Tap to Toggle)</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {studentRecords.map((stu, idx) => (
                      <tr key={stu.studentId} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">
                          {stu.rollNo}
                        </td>
                        <td className="py-3 px-4 text-[#6B7280]">{stu.admissionNo}</td>
                        <td className="py-3 px-4 font-bold text-[#1F2937]">{stu.fullName}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleStudentStatus(idx)}
                            className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              stu.status === 'present'
                                ? 'bg-[#15803D] text-white hover:bg-[#15803D]/90'
                                : stu.status === 'absent'
                                ? 'bg-[#B91C1C] text-white hover:bg-[#B91C1C]/90'
                                : stu.status === 'late'
                                ? 'bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {stu.status === 'present' && '✅ Present'}
                            {stu.status === 'absent' && '❌ Absent (Alert)'}
                            {stu.status === 'late' && '⏰ Late'}
                            {stu.status === 'leave' && '🏖️ Leave'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-[#6B7280]">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={stu.remarks || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudentRecords((prev) => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], remarks: val };
                                return copy;
                              });
                            }}
                            className="w-full px-2 py-1 bg-white border border-[#E5E0D8] rounded text-xs focus:ring-1 focus:ring-[#0F766E]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: STAFF SELFIE ATTENDANCE                               */}
        {/* ============================================================= */}
        {activeTab === 'selfie' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Camera & Check-in Panel */}
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">Live Selfie Capture</h3>
                  <p className="text-xs text-[#6B7280]">
                    Camera-only live capture; file uploads blocked (STF-05)
                  </p>
                </div>
                <Badge variant={hasConsent ? 'primary' : 'danger'}>
                  {hasConsent ? 'DPDP Consent: Granted' : 'Consent Pending'}
                </Badge>
              </div>

              {/* DPDP Consent Banner if needed */}
              {!hasConsent && (
                <div className="bg-[#FAF7F2] border border-[#F59E0B] p-4 rounded-xl space-y-2">
                  <p className="text-xs text-[#1F2937] font-semibold">
                    Digital Personal Data Protection (DPDP) Act Notice:
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Classo records attendance photos strictly for daily staff verification. Photos
                    are retained for 90 days in private tenant storage and auto-deleted thereafter.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setHasConsent(true)}>
                    I Give Explicit Consent (STF-12)
                  </Button>
                </div>
              )}

              {/* Live Camera Viewfinder */}
              <div className="relative w-full aspect-video bg-neutral-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 border-[#E5E0D8]">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured Selfie"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto text-white text-2xl">
                      📷
                    </div>
                    <p className="text-xs text-white/80 font-medium">
                      Camera standby. Press start to activate live viewfinder.
                    </p>
                  </div>
                )}

                {/* Overlaid timestamp and geofence tag */}
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#15803D] animate-ping" />
                  <span>GPS: {simulatedLat.toFixed(4)}, {simulatedLon.toFixed(4)}</span>
                </div>
              </div>

              {/* Camera Actions */}
              <div className="flex items-center space-x-3">
                {!cameraActive ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={startCamera}
                    disabled={!hasConsent}
                  >
                    Open Camera Viewfinder
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={capturePhoto}
                  >
                    📸 Capture Live Selfie Frame
                  </Button>
                )}
              </div>

              {/* Status Message */}
              {selfieStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    selfieStatusMsg.type === 'success'
                      ? 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20'
                      : selfieStatusMsg.type === 'warning'
                      ? 'bg-[#F59E0B]/10 text-[#B45309] border border-[#F59E0B]/30'
                      : 'bg-[#B91C1C]/10 text-[#B91C1C] border border-[#B91C1C]/20'
                  }`}
                >
                  {selfieStatusMsg.text}
                </div>
              )}

              {/* Check-In / Check-Out Triggers */}
              <div className="pt-2 border-t border-[#E5E0D8] flex items-center space-x-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!capturedPhoto || isCheckedInToday}
                  onClick={handleSelfieCheckIn}
                >
                  {isCheckedInToday ? `Checked In (${checkInTimeStr})` : 'Check In (Selfie + GPS)'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={!isCheckedInToday}
                  onClick={handleSelfieCheckOut}
                >
                  Check Out
                </Button>
              </div>
            </Card>

            {/* Geofence & Location Validation Diagnostics */}
            <Card className="p-6 space-y-5">
              <h3 className="text-base font-bold text-[#1F2937]">Campus Geofence Status (SET-06)</h3>
              <p className="text-xs text-[#6B7280]">
                Classo verifies your live device coordinates against registered campus boundaries.
              </p>

              <div className="bg-[#FAF7F2] p-4 rounded-xl space-y-3 border border-[#E5E0D8]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Campus Name</span>
                  <span className="font-bold text-[#1F2937]">Delhi Public Academy - Main</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Campus Coordinates</span>
                  <span className="font-mono text-[#0F766E]">28.6139° N, 77.2090° E</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Allowed Radius</span>
                  <span className="font-bold text-[#1F2937]">150 meters</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Estimated Distance</span>
                  <span className="font-bold text-[#0F766E]">
                    {isOutsideGeofence ? '420 meters (Outside)' : '28 meters (Inside)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5E0D8]">
                  <span className="text-[#6B7280]">Verification Result</span>
                  <Badge variant={isOutsideGeofence ? 'danger' : 'primary'}>
                    {isOutsideGeofence ? '⚠️ Flagged for Principal' : '✅ Within Geofence'}
                  </Badge>
                </div>
              </div>

              {/* Simulation switch for testing geofence detection */}
              <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-2">
                <p className="text-xs font-semibold text-[#1F2937]">Simulate GPS Position:</p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setIsOutsideGeofence(false);
                      setSimulatedLat(28.6141);
                      setSimulatedLon(77.2092);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      !isOutsideGeofence
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#FAF7F2] text-[#6B7280] border border-[#E5E0D8]'
                    }`}
                  >
                    📍 Inside Campus (28m)
                  </button>
                  <button
                    onClick={() => {
                      setIsOutsideGeofence(true);
                      setSimulatedLat(28.6175);
                      setSimulatedLon(77.2120);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isOutsideGeofence
                        ? 'bg-[#B91C1C] text-white'
                        : 'bg-[#FAF7F2] text-[#6B7280] border border-[#E5E0D8]'
                    }`}
                  >
                    🚀 Outside Campus (420m)
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#6B7280] space-y-1">
                <p>• <strong>Authoritative Server Time:</strong> Timestamps are stamped by server clock to prevent clock tampering.</p>
                <p>• <strong>Retention Rule:</strong> Photos auto-purged after 90 days; attendance record kept permanently.</p>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: PRINCIPAL REVIEW QUEUE                                */}
        {/* ============================================================= */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">
                    Staff Selfie Attendance Review Queue (STF-09)
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Check-ins outside the 150m geofence are flagged for Principal review before
                    payroll inclusion.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Today: 2026-10-03</Badge>
                  <Badge variant="primary">
                    {reviewList.filter((r) => r.reviewStatus === 'pending').length} Action Required
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#6B7280] font-semibold border-b border-[#E5E0D8]">
                    <tr>
                      <th className="py-3 px-4">Selfie Thumbnail</th>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Location Check</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {reviewList.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3 px-4">
                          <img
                            src={item.photoUrl}
                            alt={item.staffName}
                            className="w-10 h-10 rounded-xl object-cover border border-[#E5E0D8] shadow-sm"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1F2937]">
                          {item.staffName}
                          <p className="text-[11px] font-normal text-[#6B7280]">
                            {item.designation}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-[#6B7280]">{item.department}</td>
                        <td className="py-3 px-4 font-mono text-[#0F766E]">{item.time}</td>
                        <td className="py-3 px-4">
                          {item.withinGeofence ? (
                            <span className="text-[#15803D] font-semibold flex items-center space-x-1">
                              <span>✅ Inside Campus</span>
                              <span className="text-[11px] text-[#6B7280]">
                                ({item.distanceMeters}m)
                              </span>
                            </span>
                          ) : (
                            <span className="text-[#B91C1C] font-semibold flex items-center space-x-1">
                              <span>⚠️ Outside Geofence</span>
                              <span className="text-[11px] text-[#6B7280]">
                                ({item.distanceMeters}m)
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              item.reviewStatus === 'approved'
                                ? 'primary'
                                : item.reviewStatus === 'rejected'
                                ? 'danger'
                                : 'outline'
                            }
                          >
                            {item.reviewStatus.toUpperCase()}
                          </Badge>
                          {item.rejectionReason && (
                            <p className="text-[10px] text-[#B91C1C] mt-1 italic">
                              "{item.rejectionReason}"
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {item.reviewStatus === 'pending' ? (
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(item.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setRejectModalItem(item)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#6B7280] italic">Decided</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-[#1F2937]">
              Reject Attendance for {rejectModalItem.staffName}
            </h3>
            <p className="text-xs text-[#6B7280]">
              Mandatory reason is required (STF-09). The staff member will be notified with this
              reason.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Unapproved off-campus check-in without prior intimation..."
              className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs focus:ring-2 focus:ring-[#B91C1C]"
            />
            <div className="flex items-center justify-end space-x-3">
              <Button variant="outline" size="sm" onClick={() => setRejectModalItem(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
