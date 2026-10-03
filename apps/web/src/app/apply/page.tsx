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

export default function PublicAdmissionApplyPage() {
  const [instituteCode, setInstituteCode] = useState('DPS001');
  const [formData, setFormData] = useState({
    studentName: '',
    dob: '2012-05-15',
    gender: 'male',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    gradeApplyingFor: 'Class 10',
    address: '',
  });

  const [submittedApp, setSubmittedApp] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const appNo = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedApp({
        applicationNo: appNo,
        studentName: formData.studentName,
        grade: formData.gradeApplyingFor,
        parentPhone: formData.parentPhone,
        date: new Date().toLocaleDateString('en-GB'),
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-xl font-heading shadow-sm">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading text-[#0F766E]">
                Student Online Admission (ADM-01)
              </h1>
              <p className="text-xs text-[#6B7280]">
                Apply for admission to Delhi Public School (DPS001)
              </p>
            </div>
          </div>
          <Badge variant="primary">Public Portal</Badge>
        </div>

        {submittedApp ? (
          <Card className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <CardTitle className="text-2xl text-[#15803D]">
              Application Submitted!
            </CardTitle>
            <p className="text-sm text-[#1F2937]">
              Admission application for <strong>{submittedApp.studentName}</strong> has been received.
            </p>
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8] text-left text-xs space-y-2 text-[#6B7280]">
              <p>• <strong>Application Reference:</strong> <span className="font-mono font-bold text-[#0F766E]">{submittedApp.applicationNo}</span></p>
              <p>• <strong>Grade Applying For:</strong> {submittedApp.grade}</p>
              <p>• <strong>Parent Mobile:</strong> {submittedApp.parentPhone}</p>
              <p>• <strong>Status:</strong> Under Review by Front Office (ADM-03)</p>
            </div>
            <p className="text-xs text-[#6B7280]">
              Upon review and approval by the institute, an official admission number will be generated.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmittedApp(null)}
            >
              Submit Another Application
            </Button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Student Information</CardTitle>
                <p className="text-xs text-[#6B7280]">Enter details of the student</p>
              </CardHeader>
              <div className="space-y-4">
                <Input
                  label="Student Full Name *"
                  placeholder="e.g. Aryan Sharma"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth *"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                      Class / Grade Applying For *
                    </label>
                    <select
                      value={formData.gradeApplyingFor}
                      onChange={(e) =>
                        setFormData({ ...formData, gradeApplyingFor: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-lg text-sm text-[#1F2937] focus:ring-2 focus:ring-[#0F766E]"
                    >
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11 (Science)">Class 11 (Science)</option>
                      <option value="Class 12 (Science)">Class 12 (Science)</option>
                      <option value="JEE Target Batch">JEE Target Batch</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parent / Guardian Information</CardTitle>
                <p className="text-xs text-[#6B7280]">Primary contact for admission notifications</p>
              </CardHeader>
              <div className="space-y-4">
                <Input
                  label="Parent Full Name *"
                  placeholder="e.g. Ramesh Sharma"
                  value={formData.parentName}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Parent Mobile Phone *"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.parentPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, parentPhone: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Parent Email Address *"
                    type="email"
                    placeholder="parent@example.com"
                    value={formData.parentEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, parentEmail: e.target.value })
                    }
                    required
                  />
                </div>

                <Input
                  label="Residential Address"
                  placeholder="House number, Street, City"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
                Submit Online Application (ADM-01)
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
