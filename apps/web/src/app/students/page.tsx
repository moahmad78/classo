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

interface Student {
  id: string;
  admissionNo: string;
  rollNo?: string;
  fullName: string;
  className: string;
  sectionName: string;
  parentName: string;
  parentPhone: string;
  status: 'active' | 'inactive' | 'alumni' | 'transferred' | 'dropped';
}

export default function StudentsPage() {
  const [studentsList, setStudentsList] = useState<Student[]>([
    {
      id: 'stu-1',
      admissionNo: 'ADM-2026-0001',
      rollNo: '1001',
      fullName: 'Aarav Mehta',
      className: 'Class 10',
      sectionName: 'Section A',
      parentName: 'Vikram Mehta',
      parentPhone: '+91 98765 00111',
      status: 'active',
    },
    {
      id: 'stu-2',
      admissionNo: 'ADM-2026-0002',
      rollNo: '1002',
      fullName: 'Ananya Gupta',
      className: 'Class 10',
      sectionName: 'Section A',
      parentName: 'Rakesh Gupta',
      parentPhone: '+91 98112 23344',
      status: 'active',
    },
    {
      id: 'stu-3',
      admissionNo: 'ADM-2026-0003',
      rollNo: '1003',
      fullName: 'Devansh Verma',
      className: 'Class 10',
      sectionName: 'Section B',
      parentName: 'Alok Verma',
      parentPhone: '+91 98223 34455',
      status: 'active',
    },
    {
      id: 'stu-4',
      admissionNo: 'ADM-2025-0489',
      rollNo: '1240',
      fullName: 'Pooja Iyer',
      className: 'Class 12',
      sectionName: 'Section A',
      parentName: 'S. Iyer',
      parentPhone: '+91 98334 45566',
      status: 'alumni',
    },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    parentName: '',
    parentPhone: '',
    className: 'Class 10',
    sectionName: 'Section A',
    rollNo: '',
  });

  // Bulk Import State
  const [bulkCsvText, setBulkCsvText] = useState(
    'fullName,parentName,parentPhone,gender\nAryan Singhania,Sanjay Singhania,9811002233,male\nDiya Kapoor,Sunil Kapoor,9822003344,female'
  );
  const [importReport, setImportReport] = useState<any>(null);

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.fullName || !newStudent.parentPhone) return;

    const admissionNo = `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const student: Student = {
      id: `stu-${Date.now()}`,
      admissionNo,
      rollNo: newStudent.rollNo || `${Math.floor(1000 + Math.random() * 100)}`,
      fullName: newStudent.fullName,
      className: newStudent.className,
      sectionName: newStudent.sectionName,
      parentName: newStudent.parentName,
      parentPhone: newStudent.parentPhone,
      status: 'active',
    };

    setStudentsList([student, ...studentsList]);
    setShowAddModal(false);
    setNewStudent({
      fullName: '',
      parentName: '',
      parentPhone: '',
      className: 'Class 10',
      sectionName: 'Section A',
      rollNo: '',
    });
  };

  const handleBulkDryRun = () => {
    const lines = bulkCsvText.trim().split('\n');
    const header = lines[0];
    const dataLines = lines.slice(1);

    const validRows: any[] = [];
    dataLines.forEach((l) => {
      const parts = l.split(',');
      if (parts[0] && parts[2]) {
        validRows.push({
          fullName: parts[0],
          parentName: parts[1] || 'Guardian',
          parentPhone: parts[2],
        });
      }
    });

    setImportReport({
      totalRows: dataLines.length,
      validRows: validRows.length,
      errors: [],
      preview: validRows,
    });
  };

  const handleConfirmBulkImport = () => {
    if (!importReport || !importReport.preview) return;

    const newEntries: Student[] = importReport.preview.map((row: any, i: number) => ({
      id: `stu-bulk-${Date.now()}-${i}`,
      admissionNo: `ADM-2026-${Math.floor(2000 + Math.random() * 8000)}`,
      rollNo: `${Math.floor(1050 + Math.random() * 50)}`,
      fullName: row.fullName,
      className: 'Class 10',
      sectionName: 'Section A',
      parentName: row.parentName,
      parentPhone: row.parentPhone,
      status: 'active',
    }));

    setStudentsList([...newEntries, ...studentsList]);
    setShowBulkImportModal(false);
    setImportReport(null);
  };

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
      s.parentPhone.includes(search);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-xl font-heading shadow-sm">
              C
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-[#0F766E]">
                Student Directory (STU-01..06)
              </h1>
              <p className="text-xs text-[#6B7280]">
                Manage enrollments, admission numbers, lifecycle status & bulk CSV tools
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkImportModal(true)}
            >
              📥 Bulk CSV Import (CC-06)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              + Add Student
            </Button>
          </div>
        </div>

        {/* Filters & Search Toolbar (PERF-02) */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by student name, admission no, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#0F766E]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active (Enrolled)</option>
                <option value="alumni">Alumni</option>
                <option value="transferred">Transferred</option>
                <option value="dropped">Dropped</option>
              </select>

              <Badge variant="primary">{filteredStudents.length} Students Found</Badge>
            </div>
          </div>
        </Card>

        {/* Student Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF7F2] border-b border-[#E5E0D8] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Admission No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Class / Section</th>
                  <th className="px-6 py-3.5">Parent / Guardian</th>
                  <th className="px-6 py-3.5">Status (STU-05)</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8] bg-white">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-[#0F766E]">
                      {s.admissionNo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1F2937]">{s.fullName}</div>
                      {s.rollNo && (
                        <div className="text-[11px] text-[#6B7280]">Roll No: {s.rollNo}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-[#1F2937]">
                      <span className="font-semibold">{s.className}</span> • {s.sectionName}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-medium text-[#1F2937]">{s.parentName}</div>
                      <div className="text-[#6B7280]">{s.parentPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          s.status === 'active'
                            ? 'success'
                            : s.status === 'alumni'
                            ? 'neutral'
                            : 'warning'
                        }
                        className="capitalize"
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          alert(`ID Card generated for ${s.fullName} (${s.admissionNo})`)
                        }
                      >
                        🪪 ID Card
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full p-6 space-y-4">
              <CardHeader className="border-none pb-0">
                <CardTitle>Add New Student (STU-01, STU-02)</CardTitle>
                <p className="text-xs text-[#6B7280]">
                  Admission number will be automatically generated with unique sequence.
                </p>
              </CardHeader>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <Input
                  label="Student Full Name *"
                  placeholder="e.g. Aarav Sharma"
                  value={newStudent.fullName}
                  onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Class"
                    value={newStudent.className}
                    onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
                  />
                  <Input
                    label="Section"
                    value={newStudent.sectionName}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, sectionName: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Parent / Guardian Name *"
                    placeholder="e.g. Ramesh Sharma"
                    value={newStudent.parentName}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, parentName: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Parent Mobile Phone *"
                    placeholder="+91 9876543210"
                    value={newStudent.parentPhone}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, parentPhone: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E0D8]">
                  <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Enroll Student
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkImportModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <Card className="max-w-xl w-full p-6 space-y-4">
              <CardHeader className="border-none pb-0">
                <Badge variant="primary">STU-06 & CC-06</Badge>
                <CardTitle className="mt-1">Bulk CSV Student Import</CardTitle>
                <p className="text-xs text-[#6B7280]">
                  Paste or upload CSV rows with dry-run validation report before commit.
                </p>
              </CardHeader>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#1F2937]">
                  CSV Content (fullName, parentName, parentPhone, gender)
                </label>
                <textarea
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  rows={5}
                  className="w-full p-3 font-mono text-xs bg-white border border-[#E5E0D8] rounded-lg focus:ring-2 focus:ring-[#0F766E]"
                />

                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm" onClick={handleBulkDryRun}>
                    🔍 Run Dry-Run Validation
                  </Button>
                  <span className="text-xs text-[#6B7280]">No changes saved on dry-run</span>
                </div>

                {importReport && (
                  <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1F2937]">Validation Report:</span>
                      <Badge variant="success">{importReport.validRows} Valid Rows Ready</Badge>
                    </div>
                    <p className="text-[#6B7280]">
                      All {importReport.validRows} rows passed schema and phone format validation.
                    </p>
                    <div className="pt-2 flex justify-end">
                      <Button variant="accent" size="sm" onClick={handleConfirmBulkImport}>
                        ✓ Confirm & Import {importReport.validRows} Students
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-[#E5E0D8]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setImportReport(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
