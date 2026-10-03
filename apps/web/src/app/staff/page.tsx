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

interface StaffMember {
  id: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  departmentName: string;
  email: string;
  phone: string;
  assignedSubjects: string[];
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([
    {
      id: 'stf-1',
      employeeCode: 'EMP-0101',
      fullName: 'Dr. Anita Sharma',
      designation: 'Principal',
      departmentName: 'Administration',
      email: 'principal@dpsrohini.in',
      phone: '+91 98110 02233',
      assignedSubjects: ['Leadership', 'Ethics'],
    },
    {
      id: 'stf-2',
      employeeCode: 'EMP-0142',
      fullName: 'Mr. R. Sharma',
      designation: 'Senior PGT Physics',
      departmentName: 'Senior Science Wing',
      email: 'teacher.physics@dpsrohini.in',
      phone: '+91 98765 43222',
      assignedSubjects: ['Physics (Class 10-A)', 'Physics (Class 12-A)'],
    },
    {
      id: 'stf-3',
      employeeCode: 'EMP-0155',
      fullName: 'Ms. Priya Kapoor',
      designation: 'TGT Mathematics',
      departmentName: 'Secondary Wing',
      email: 'priya.maths@dpsrohini.in',
      phone: '+91 98334 00112',
      assignedSubjects: ['Mathematics (Class 9-A)', 'Mathematics (Class 10-B)'],
    },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);

  const [inviteForm, setInviteForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    designation: 'TGT Chemistry',
    departmentName: 'Senior Science Wing',
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.fullName || !inviteForm.email) return;

    const employeeCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const rawToken = 'inv_' + Math.random().toString(36).substring(2, 12);
    const inviteLink = `https://dpsrohini.classo.in/set-password?token=${rawToken}`;

    const newTeacher: StaffMember = {
      id: `stf-${Date.now()}`,
      employeeCode,
      fullName: inviteForm.fullName,
      designation: inviteForm.designation,
      departmentName: inviteForm.departmentName,
      email: inviteForm.email,
      phone: inviteForm.phone,
      assignedSubjects: ['Pending Assignment (STF-04)'],
    };

    setStaffList([...staffList, newTeacher]);
    setInviteResult({
      name: inviteForm.fullName,
      email: inviteForm.email,
      inviteLink,
      expiresAt: 'Valid for 72 hours (STF-15)',
    });
    setInviteForm({
      fullName: '',
      email: '',
      phone: '',
      designation: 'TGT Chemistry',
      departmentName: 'Senior Science Wing',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-xl font-heading shadow-sm">
              C
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-[#0F766E]">
                Staff & Faculty Directory (STF-*)
              </h1>
              <p className="text-xs text-[#6B7280]">
                Teacher onboarding, departments, teaching assignments & selfie-attendance readiness
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setInviteResult(null);
              setShowInviteModal(true);
            }}
          >
            + Onboard Teacher (STF-15)
          </Button>
        </div>

        {/* Invite Link Generated Banner */}
        {inviteResult && (
          <Card className="p-4 bg-[#DCFCE7]/40 border-[#BBF7D0] text-xs space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="success">STF-15 Invite Generated</Badge>
              <span className="font-bold text-[#15803D]">
                Invite link created for {inviteResult.name}!
              </span>
            </div>
            <p className="text-[#1F2937]">
              Teacher cannot access panel until the invite is accepted. Link valid for 72 hours:
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-[#BBF7D0]">
              <code className="text-[#0F766E] font-mono">{inviteResult.inviteLink}</code>
            </div>
          </Card>
        )}

        {/* Staff Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E5E0D8] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Staff Name & Designation</th>
                  <th className="px-6 py-3.5">Department (SET-05)</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Teaching Assignments (STF-04)</th>
                  <th className="px-6 py-3.5 text-right">Selfie Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8] bg-white">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-[#0F766E]">
                      {st.employeeCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1F2937]">{st.fullName}</div>
                      <div className="text-xs text-[#6B7280]">{st.designation}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <Badge variant="neutral">{st.departmentName}</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="text-[#1F2937]">{st.email}</div>
                      <div className="text-[#6B7280]">{st.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#1F2937]">
                      {st.assignedSubjects.map((sub, i) => (
                        <div key={i} className="text-[11px] font-medium text-[#0F766E]">
                          • {sub}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="primary">Selfie Enabled (Phase 3)</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Invite Teacher Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full p-6 space-y-4">
              <CardHeader className="border-none pb-0">
                <Badge variant="primary">STF-15 Requirement</Badge>
                <CardTitle className="mt-1">Onboard Teacher / Faculty</CardTitle>
                <p className="text-xs text-[#6B7280]">
                  System creates account and sends a 72-hour invite link. Teacher sets password on first login.
                </p>
              </CardHeader>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <Input
                  label="Teacher Full Name *"
                  placeholder="e.g. Dr. Rajesh Agrawal"
                  value={inviteForm.fullName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, fullName: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="teacher@institute.edu"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Mobile Number *"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={inviteForm.phone}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Designation *"
                    placeholder="e.g. PGT Mathematics"
                    value={inviteForm.designation}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, designation: e.target.value })
                    }
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Department (SET-05)
                    </label>
                    <select
                      value={inviteForm.departmentName}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, departmentName: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#0F766E]"
                    >
                      <option value="Senior Science Wing">Senior Science Wing</option>
                      <option value="Secondary Wing">Secondary Wing</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E0D8]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Generate 72h Invite Link
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
