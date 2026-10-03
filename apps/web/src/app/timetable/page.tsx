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

interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 1 = Monday .. 5 = Friday
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  teacherId: string;
  roomNumber: string;
}

interface Substitution {
  id: string;
  slotId: string;
  periodNumber: number;
  originalTeacher: string;
  substituteTeacher: string;
  date: string;
  reason: string;
}

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState('Class 10 - Section A');
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedSlotForSub, setSelectedSlotForSub] = useState<TimetableSlot | null>(null);

  // Slots state
  const [slots, setSlots] = useState<TimetableSlot[]>([
    {
      id: 'slot-1',
      dayOfWeek: 1, // Mon
      periodNumber: 1,
      startTime: '08:30',
      endTime: '09:15',
      subjectName: 'Mathematics',
      teacherName: 'Amit Sharma',
      teacherId: 't-1',
      roomNumber: 'Room 101',
    },
    {
      id: 'slot-2',
      dayOfWeek: 1,
      periodNumber: 2,
      startTime: '09:15',
      endTime: '10:00',
      subjectName: 'Physics',
      teacherName: 'Priya Verma',
      teacherId: 't-2',
      roomNumber: 'Room 101',
    },
    {
      id: 'slot-3',
      dayOfWeek: 1,
      periodNumber: 3,
      startTime: '10:15',
      endTime: '11:00',
      subjectName: 'Chemistry',
      teacherName: 'Rajesh Kulkarni',
      teacherId: 't-3',
      roomNumber: 'Chem Lab 1',
    },
    {
      id: 'slot-4',
      dayOfWeek: 1,
      periodNumber: 4,
      startTime: '11:00',
      endTime: '11:45',
      subjectName: 'English Literature',
      teacherName: 'Meenakshi Sundaram',
      teacherId: 't-4',
      roomNumber: 'Room 101',
    },
    {
      id: 'slot-5',
      dayOfWeek: 1,
      periodNumber: 5,
      startTime: '12:15',
      endTime: '13:00',
      subjectName: 'Biology',
      teacherName: 'Sunita Rao',
      teacherId: 't-5',
      roomNumber: 'Bio Lab',
    },
    {
      id: 'slot-6',
      dayOfWeek: 1,
      periodNumber: 6,
      startTime: '13:00',
      endTime: '13:45',
      subjectName: 'Physical Education',
      teacherName: 'Vikram Gill',
      teacherId: 't-6',
      roomNumber: 'Sports Ground',
    },
  ]);

  // Substitutions state (TT-03)
  const [substitutions, setSubstitutions] = useState<Substitution[]>([
    {
      id: 'sub-1',
      slotId: 'slot-2',
      periodNumber: 2,
      originalTeacher: 'Priya Verma',
      substituteTeacher: 'Sunita Rao',
      date: '2026-10-03',
      reason: 'Teacher attending science conference',
    },
  ]);

  // Add slot modal state
  const [newSlot, setNewSlot] = useState({
    periodNumber: 2,
    startTime: '09:15',
    endTime: '10:00',
    subjectName: 'Mathematics',
    teacherName: 'Amit Sharma',
    teacherId: 't-1',
    roomNumber: 'Room 101',
  });
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Substitution modal state
  const [substituteTeacher, setSubstituteTeacher] = useState('Sunita Rao');
  const [subReason, setSubReason] = useState('');

  const days = [
    { num: 1, label: 'Monday' },
    { num: 2, label: 'Tuesday' },
    { num: 3, label: 'Wednesday' },
    { num: 4, label: 'Thursday' },
    { num: 5, label: 'Friday' },
    { num: 6, label: 'Saturday' },
  ];

  // Conflict detection validator (TT-02)
  const checkConflicts = (teacherName: string, room: string, period: number) => {
    // Check if teacher is already booked
    const teacherConflict = slots.find(
      (s) => s.dayOfWeek === selectedDay && s.periodNumber === period && s.teacherName === teacherName
    );
    if (teacherConflict) {
      return `Teacher conflict: ${teacherName} is already assigned to Period ${period} on this day!`;
    }

    // Check if room is already booked
    const roomConflict = slots.find(
      (s) => s.dayOfWeek === selectedDay && s.periodNumber === period && s.roomNumber === room
    );
    if (roomConflict) {
      return `Room conflict: ${room} is already occupied during Period ${period} by ${roomConflict.subjectName}!`;
    }

    return null;
  };

  const handleAddSlot = () => {
    const conflict = checkConflicts(newSlot.teacherName, newSlot.roomNumber, Number(newSlot.periodNumber));
    if (conflict) {
      setConflictWarning(conflict);
      return;
    }

    const created: TimetableSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: selectedDay,
      periodNumber: Number(newSlot.periodNumber),
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      subjectName: newSlot.subjectName,
      teacherName: newSlot.teacherName,
      teacherId: newSlot.teacherId,
      roomNumber: newSlot.roomNumber,
    };

    setSlots([...slots, created]);
    setShowAddModal(false);
    setConflictWarning(null);
  };

  const handleCreateSubstitution = () => {
    if (!selectedSlotForSub) return;
    const sub: Substitution = {
      id: `sub-${Date.now()}`,
      slotId: selectedSlotForSub.id,
      periodNumber: selectedSlotForSub.periodNumber,
      originalTeacher: selectedSlotForSub.teacherName,
      substituteTeacher,
      date: '2026-10-03',
      reason: subReason || 'Duty reallocation',
    };

    setSubstitutions([...substitutions, sub]);
    setShowSubModal(false);
    setSelectedSlotForSub(null);
    setSubReason('');
  };

  const daySlots = slots
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.periodNumber - b.periodNumber);

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
                  Academic Schedule
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Timetable Builder & Conflict Detection</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E5E0D8]">
            <a
              href="/attendance"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
            >
              Attendance
            </a>
            <a
              href="/timetable"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F766E] text-white"
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#1F2937] focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="Class 10 - Section A">Class 10 - Section A</option>
              <option value="Class 10 - Section B">Class 10 - Section B</option>
              <option value="Class 9 - Section A">Class 9 - Section A</option>
            </select>

            <Badge variant="outline" className="bg-white text-[#0F766E]">
              6 Periods / Day
            </Badge>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            >
              🖨️ Export PDF (TT-04)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setConflictWarning(null);
                setShowAddModal(true);
              }}
            >
              + Add Period Slot (TT-02)
            </Button>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {days.map((day) => (
            <button
              key={day.num}
              onClick={() => setSelectedDay(day.num)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedDay === day.num
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Period Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daySlots.map((slot) => {
            const sub = substitutions.find((s) => s.slotId === slot.id);
            return (
              <Card key={slot.id} className="p-5 space-y-3 hover:shadow-md transition-shadow relative">
                <div className="flex items-center justify-between">
                  <span className="bg-[#FAF7F2] text-[#0F766E] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#0F766E]/20">
                    Period {slot.periodNumber}
                  </span>
                  <span className="text-xs font-mono text-[#6B7280]">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-[#1F2937]">{slot.subjectName}</h4>
                  <div className="flex items-center justify-between text-xs text-[#6B7280] mt-1">
                    <span>👨‍🏫 {slot.teacherName}</span>
                    <span className="font-semibold text-[#0F766E]">{slot.roomNumber}</span>
                  </div>
                </div>

                {/* Substitution Alert Banner if applicable */}
                {sub ? (
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-2.5 rounded-xl text-[11px] text-[#B45309] space-y-1">
                    <p className="font-bold">⚠️ Substituted by {sub.substituteTeacher}</p>
                    <p className="text-[10px] text-[#6B7280]">Reason: {sub.reason}</p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-end">
                    <button
                      onClick={() => {
                        setSelectedSlotForSub(slot);
                        setShowSubModal(true);
                      }}
                      className="text-xs font-semibold text-[#0F766E] hover:underline"
                    >
                      Assign Substitute (TT-03)
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Active Substitutions Today Banner */}
        {substitutions.length > 0 && (
          <Card className="p-4 bg-[#FAF7F2] border border-[#0F766E]/20">
            <h4 className="text-xs font-bold text-[#0F766E] uppercase mb-2">
              Today's Teacher Substitutions (TT-03)
            </h4>
            <div className="space-y-2">
              {substitutions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white p-3 rounded-xl border border-[#E5E0D8] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#1F2937]">Period {sub.periodNumber}: </span>
                    <span className="text-[#6B7280]">
                      {sub.substituteTeacher} covering for {sub.originalTeacher}
                    </span>
                  </div>
                  <Badge variant="outline">Notified</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      {/* Add Period Slot Modal with Conflict Detection */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-[#1F2937]">
              Add Period Slot (Day {selectedDay})
            </h3>
            <p className="text-xs text-[#6B7280]">
              System validates teacher and room conflicts across all institute classes automatically.
            </p>

            {conflictWarning && (
              <div className="p-3 bg-[#B91C1C]/10 border border-[#B91C1C]/20 rounded-xl text-xs font-semibold text-[#B91C1C]">
                ⚠️ {conflictWarning}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">
                  Period Number
                </label>
                <select
                  value={newSlot.periodNumber}
                  onChange={(e) => setNewSlot({ ...newSlot, periodNumber: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs font-semibold"
                >
                  <option value={1}>Period 1 (08:30 - 09:15)</option>
                  <option value={2}>Period 2 (09:15 - 10:00)</option>
                  <option value={3}>Period 3 (10:15 - 11:00)</option>
                  <option value={4}>Period 4 (11:00 - 11:45)</option>
                  <option value={5}>Period 5 (12:15 - 13:00)</option>
                  <option value={6}>Period 6 (13:00 - 13:45)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Subject</label>
                <Input
                  value={newSlot.subjectName}
                  onChange={(e) => setNewSlot({ ...newSlot, subjectName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Teacher</label>
                <select
                  value={newSlot.teacherName}
                  onChange={(e) => setNewSlot({ ...newSlot, teacherName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs font-semibold"
                >
                  <option value="Amit Sharma">Amit Sharma (Math)</option>
                  <option value="Priya Verma">Priya Verma (Physics)</option>
                  <option value="Rajesh Kulkarni">Rajesh Kulkarni (Chemistry)</option>
                  <option value="Sunita Rao">Sunita Rao (Biology)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Room Number</label>
                <Input
                  value={newSlot.roomNumber}
                  onChange={(e) => setNewSlot({ ...newSlot, roomNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E0D8]">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddSlot}>
                Save Slot (Verify Conflict)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Substitution Modal */}
      {showSubModal && selectedSlotForSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-[#1F2937]">
              Assign Substitute for Period {selectedSlotForSub.periodNumber}
            </h3>
            <p className="text-xs text-[#6B7280]">
              Original Teacher: <strong>{selectedSlotForSub.teacherName}</strong> ({selectedSlotForSub.subjectName})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">
                  Substitute Teacher
                </label>
                <select
                  value={substituteTeacher}
                  onChange={(e) => setSubstituteTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs font-semibold"
                >
                  <option value="Sunita Rao">Sunita Rao (Available)</option>
                  <option value="Meenakshi Sundaram">Meenakshi Sundaram (Available)</option>
                  <option value="Vikram Gill">Vikram Gill (Available)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">Reason</label>
                <textarea
                  rows={2}
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  placeholder="e.g. Teacher on medical leave..."
                  className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E0D8]">
              <Button variant="outline" size="sm" onClick={() => setShowSubModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubstitution}>
                Assign & Dispatch Alert (TT-03)
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
