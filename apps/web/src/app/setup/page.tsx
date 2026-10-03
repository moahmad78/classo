'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Input,
  Badge,
} from '@classo/ui';

export default function SetupWizardPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Wizard state
  const [instituteProfile, setInstituteProfile] = useState({
    name: 'Delhi Public School, Rohini',
    subdomain: 'dpsrohini',
    code: 'DPS001',
    academicYear: '2026-2027',
  });

  const [departmentsList, setDepartmentsList] = useState<string[]>([
    'Primary Wing',
    'Secondary Wing',
    'Senior Secondary Wing',
    'Administration',
  ]);
  const [newDeptName, setNewDeptName] = useState('');

  const [campusLocation, setCampusLocation] = useState({
    name: 'Main Campus Ground',
    latitude: '28.7041',
    longitude: '77.1025',
    radiusMeters: '150', // PRD SET-06 default
  });

  const [wizardComplete, setWizardComplete] = useState(false);

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setDepartmentsList([...departmentsList, newDeptName.trim()]);
    setNewDeptName('');
  };

  const steps = [
    { num: 1, title: 'Profile & Year', desc: 'Confirm details' },
    { num: 2, title: 'Departments (SET-05)', desc: 'Add wings/depts' },
    { num: 3, title: 'Campus Geofence (SET-06)', desc: 'Selfie attendance' },
    { num: 4, title: 'Review & Launch', desc: 'Ready for ops' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-xl font-heading shadow-sm">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-[#0F766E]">
                Principal Setup Wizard
              </h1>
              <p className="text-xs text-[#6B7280]">
                {instituteProfile.name} • First-login configuration (SET-01)
              </p>
            </div>
          </div>
          <Badge variant="primary">Setup Wizard</Badge>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                currentStep === s.num
                  ? 'border-[#0F766E] bg-white ring-2 ring-[#0F766E]/20 shadow-sm'
                  : 'border-[#E5E0D8] bg-white opacity-80'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === s.num
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#F3EFEA] text-[#1F2937]'
                  }`}
                >
                  {s.num}
                </span>
                <span className="text-xs font-bold text-[#1F2937] truncate">{s.title}</span>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1 pl-8">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Wizard Content */}
        {wizardComplete ? (
          <Card className="p-8 text-center space-y-5 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <CardTitle className="text-2xl text-[#15803D]">
              Institute Setup Complete!
            </CardTitle>
            <p className="text-sm text-[#1F2937]">
              Departments, academic year, and campus geofence have been saved. Your institute is now ready for daily operations.
            </p>
            <div className="pt-4 flex justify-center space-x-3">
              <a href="/login">
                <Button variant="primary">Proceed to Admin Dashboard</Button>
              </a>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Profile & Academic Year */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>1. Confirm Profile & Current Academic Year</CardTitle>
                  <p className="text-xs text-[#6B7280]">
                    Every academic record belongs to an academic year (CC-03).
                  </p>
                </CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Institute Name"
                    value={instituteProfile.name}
                    onChange={(e) =>
                      setInstituteProfile({ ...instituteProfile, name: e.target.value })
                    }
                  />
                  <Input
                    label="Subdomain"
                    value={`${instituteProfile.subdomain}.classo.in`}
                    disabled
                  />
                  <Input
                    label="Current Academic Year (CC-03)"
                    value={instituteProfile.academicYear}
                    onChange={(e) =>
                      setInstituteProfile({ ...instituteProfile, academicYear: e.target.value })
                    }
                  />
                  <Input label="Institute Code" value={instituteProfile.code} disabled />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="primary" onClick={() => setCurrentStep(2)}>
                    Next: Manage Departments →
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 2: Departments Management (SET-05) */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <Badge variant="primary">SET-05 Requirement</Badge>
                  <CardTitle className="mt-1">2. Manage Departments</CardTitle>
                  <p className="text-xs text-[#6B7280]">
                    Principal creates/edits departments. Teachers and subjects link to a department.
                  </p>
                </CardHeader>

                <div className="space-y-4">
                  <form onSubmit={handleAddDepartment} className="flex gap-2">
                    <Input
                      placeholder="Add Department (e.g. Science, Mathematics, Sports)"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                    />
                    <Button type="submit" variant="primary" className="whitespace-nowrap">
                      + Add Department
                    </Button>
                  </form>

                  <div className="divide-y divide-[#E5E0D8] border border-[#E5E0D8] rounded-lg">
                    {departmentsList.map((dept, index) => (
                      <div
                        key={index}
                        className="p-3 flex items-center justify-between bg-white text-sm"
                      >
                        <span className="font-semibold text-[#1F2937]">{dept}</span>
                        <Badge variant="neutral">Active Department</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    ← Back
                  </Button>
                  <Button variant="primary" onClick={() => setCurrentStep(3)}>
                    Next: Campus Geofence →
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 3: Campus Geofence Location (SET-06) */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <Badge variant="warning">SET-06 & STF-06 Geofence</Badge>
                  <CardTitle className="mt-1">
                    3. Campus Location & Staff Attendance Geofence
                  </CardTitle>
                  <p className="text-xs text-[#6B7280]">
                    GPS coordinates are compared with the campus geofence when teachers take selfie attendance.
                  </p>
                </CardHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Campus Name *"
                    value={campusLocation.name}
                    onChange={(e) =>
                      setCampusLocation({ ...campusLocation, name: e.target.value })
                    }
                  />
                  <Input
                    label="Geofence Radius (Meters) * (Default 150m)"
                    value={campusLocation.radiusMeters}
                    onChange={(e) =>
                      setCampusLocation({ ...campusLocation, radiusMeters: e.target.value })
                    }
                  />
                  <Input
                    label="Latitude *"
                    value={campusLocation.latitude}
                    onChange={(e) =>
                      setCampusLocation({ ...campusLocation, latitude: e.target.value })
                    }
                  />
                  <Input
                    label="Longitude *"
                    value={campusLocation.longitude}
                    onChange={(e) =>
                      setCampusLocation({ ...campusLocation, longitude: e.target.value })
                    }
                  />
                </div>

                <div className="mt-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#E5E0D8] text-xs text-[#6B7280] space-y-1">
                  <p className="font-bold text-[#1F2937]">Geofence Policy (STF-06):</p>
                  <p>• Check-ins within {campusLocation.radiusMeters}m are automatically accepted.</p>
                  <p>• Outside-geofence check-ins will be flagged and sent to Principal review (STF-09).</p>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    ← Back
                  </Button>
                  <Button variant="primary" onClick={() => setCurrentStep(4)}>
                    Next: Review & Launch →
                  </Button>
                </div>
              </Card>
            )}

            {/* Step 4: Review & Launch */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>4. Review & Launch Institute</CardTitle>
                  <p className="text-xs text-[#6B7280]">
                    Confirm your configuration and launch your institute portal.
                  </p>
                </CardHeader>

                <div className="space-y-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8] text-xs">
                  <p>• <strong>Institute:</strong> {instituteProfile.name} ({instituteProfile.subdomain}.classo.in)</p>
                  <p>• <strong>Academic Year:</strong> {instituteProfile.academicYear}</p>
                  <p>• <strong>Departments:</strong> {departmentsList.join(', ')}</p>
                  <p>• <strong>Campus Geofence:</strong> {campusLocation.name} ({campusLocation.radiusMeters}m radius)</p>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    ← Back
                  </Button>
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() => setWizardComplete(true)}
                  >
                    Finish Setup & Go Live!
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
