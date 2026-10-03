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
import { INSTITUTE_ROLES, InstituteRole } from '@classo/config';

interface InstituteInfo {
  name: string;
  code: string;
  subdomain: string;
  type: string;
  logoUrl?: string;
  primaryColor?: string;
}

export default function LoginPage() {
  const [instituteQuery, setInstituteQuery] = useState('DPS001');
  const [institute, setInstitute] = useState<InstituteInfo | null>({
    name: 'Delhi Public School, Rohini',
    code: 'DPS001',
    subdomain: 'dpsrohini',
    type: 'school',
  });

  const [selectedRole, setSelectedRole] = useState<InstituteRole | null>('admin');
  const [identifier, setIdentifier] = useState('principal@dpsrohini.in');
  const [password, setPassword] = useState('ClassoDemo2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  // Role details config
  const roleCards: Array<{
    role: InstituteRole;
    title: string;
    description: string;
    badge: string;
  }> = [
    {
      role: 'admin',
      title: 'Principal / Admin',
      description: 'Full administrative control, staff onboarding, approvals & reports',
      badge: 'Admin Panel',
    },
    {
      role: 'teacher',
      title: 'Teacher / Faculty',
      description: 'Daily attendance, selfie check-in, homework, and exams',
      badge: 'Teacher Panel',
    },
    {
      role: 'student',
      title: 'Student',
      description: 'Homework, timetables, test results, and class notices',
      badge: 'Student Portal',
    },
    {
      role: 'parent',
      title: 'Parent',
      description: 'Linked children progress, attendance alerts, and fee payments',
      badge: 'Parent Portal',
    },
    {
      role: 'accountant',
      title: 'Accountant',
      description: 'Fee collection, receipts, ledger, and monthly payroll runs',
      badge: 'Finance Panel',
    },
    {
      role: 'front_office',
      title: 'Front Office',
      description: 'New inquiries CRM, admissions, certificates, and visitors',
      badge: 'Reception Panel',
    },
  ];

  const handleResolveInstitute = (code: string) => {
    setInstituteQuery(code);
    if (code.toUpperCase() === 'DPS001' || code.toLowerCase() === 'dpsrohini') {
      setInstitute({
        name: 'Delhi Public School, Rohini',
        code: 'DPS001',
        subdomain: 'dpsrohini',
        type: 'school',
      });
      setErrorMessage('');
    } else if (code.toUpperCase() === 'STX001' || code.toLowerCase() === 'stxavier') {
      setInstitute({
        name: "St. Xavier's College of Engineering",
        code: 'STX001',
        subdomain: 'stxavier',
        type: 'college',
      });
      setErrorMessage('');
    } else if (code.toUpperCase() === 'APX001' || code.toLowerCase() === 'apexkota') {
      setInstitute({
        name: 'Apex IIT-JEE & NEET Academy',
        code: 'APX001',
        subdomain: 'apexkota',
        type: 'coaching',
      });
      setErrorMessage('');
    } else {
      setErrorMessage('Institute code nahi mila. Try DPS001, STX001, or APX001.');
      setInstitute(null);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !institute) return;

    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsLoading(false);
      // PRD USR-07 validation simulation
      if (selectedRole === 'admin' && identifier.includes('teacher')) {
        setErrorMessage(
          "Role Mismatch (USR-07): Aapka account 'teacher' hai, 'admin' nahi. Sahi role card chunein."
        );
        return;
      }

      setLoggedInUser({
        name: selectedRole === 'admin' ? 'Dr. Anita Sharma' : 'Faculty Member',
        role: selectedRole,
        instituteName: institute.name,
      });
    }, 600);
  };

  const setDemoCredentials = (role: InstituteRole, email: string) => {
    setSelectedRole(role);
    setIdentifier(email);
    setPassword('ClassoDemo2026!');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center space-x-3">
            <a
              href="/"
              className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-xl font-heading shadow-sm"
            >
              C
            </a>
            <div>
              <h1 className="text-xl font-bold font-heading text-[#0F766E]">
                Classo Institute Login
              </h1>
              <p className="text-xs text-[#6B7280]">Role-Selector Authentication (USR-01)</p>
            </div>
          </div>
          <a href="/register">
            <Button variant="outline" size="sm">
              New Institute? Register
            </Button>
          </a>
        </div>

        {/* Step 1: Institute Resolution Banner (PRD USR-01) */}
        <Card className="p-4 bg-white border-[#E5E0D8]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E5E0D8] flex items-center justify-center font-bold text-lg text-[#0F766E]">
                🏫
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Active Institute (Resolved via Subdomain / Code):</p>
                <p className="text-base font-bold text-[#1F2937]">
                  {institute ? institute.name : 'Unknown Institute'}
                </p>
                {institute && (
                  <p className="text-xs text-[#0F766E]">
                    {institute.subdomain}.classo.in • Code: {institute.code} • Type: {institute.type}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Input
                placeholder="Change Code (e.g. DPS001)"
                value={instituteQuery}
                onChange={(e) => setInstituteQuery(e.target.value)}
                className="max-w-[200px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolveInstitute(instituteQuery)}
              >
                Resolve
              </Button>
            </div>
          </div>
          {errorMessage && <p className="text-xs text-[#B91C1C] mt-2 font-medium">{errorMessage}</p>}
        </Card>

        {loggedInUser ? (
          <Card className="p-8 text-center space-y-5 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <CardTitle className="text-2xl text-[#15803D]">
              Logged in successfully!
            </CardTitle>
            <p className="text-sm text-[#1F2937]">
              Welcome, <strong>{loggedInUser.name}</strong> to the{' '}
              <Badge variant="primary" className="ml-1 uppercase">
                {loggedInUser.role} panel
              </Badge>
            </p>
            <p className="text-xs text-[#6B7280]">
              Per PRD USR-11, bundle code-splitting is isolated for your role.
            </p>
            <div className="pt-4 flex justify-center space-x-3">
              {loggedInUser.role === 'admin' && (
                <a href="/setup">
                  <Button variant="primary">Launch Setup Wizard (SET-01)</Button>
                </a>
              )}
              <Button variant="outline" onClick={() => setLoggedInUser(null)}>
                Logout / Switch Role
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Step 2: Role Selector Cards (PRD USR-01) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold font-heading text-[#1F2937]">
                  Select Your Role
                </h2>
                <span className="text-xs text-[#6B7280]">Click to choose your portal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleCards.map((rc) => {
                  const isSelected = selectedRole === rc.role;
                  return (
                    <div
                      key={rc.role}
                      onClick={() => {
                        setSelectedRole(rc.role);
                        setErrorMessage('');
                      }}
                      className={`cursor-pointer p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'border-[#0F766E] bg-white ring-2 ring-[#0F766E]/20 shadow-md'
                          : 'border-[#E5E0D8] bg-white hover:border-[#D3CDC3]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#1F2937]">{rc.title}</span>
                        <Badge variant={isSelected ? 'primary' : 'neutral'}>{rc.badge}</Badge>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1.5">{rc.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs bg-[#FAF7F2] p-3 rounded-lg border border-[#E5E0D8]">
              <span className="font-semibold text-[#6B7280]">Quick Demo Logins:</span>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin', 'principal@dpsrohini.in')}
                className="px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-[#0F766E] font-medium hover:bg-[#FAF7F2]"
              >
                Principal (Dr. Anita Sharma)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('teacher', 'teacher.physics@dpsrohini.in')}
                className="px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-[#0F766E] font-medium hover:bg-[#FAF7F2]"
              >
                Teacher (Faculty)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('accountant', 'accounts@dpsrohini.in')}
                className="px-2.5 py-1 rounded-md bg-white border border-[#E5E0D8] text-[#0F766E] font-medium hover:bg-[#FAF7F2]"
              >
                Accountant
              </button>
            </div>

            {/* Step 3: Credentials Form */}
            <Card className="max-w-md mx-auto p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center pb-2 border-b border-[#FAF7F2]">
                  <Badge variant="primary" className="uppercase">
                    Logging in as {selectedRole}
                  </Badge>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Enter your registered credentials below
                  </p>
                </div>

                <Input
                  label="Registered Email or Mobile *"
                  placeholder="e.g. principal@dpsrohini.in"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />

                <Input
                  label="Password *"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {errorMessage && (
                  <p className="text-xs text-[#B91C1C] bg-[#FEE2E2] p-2.5 rounded-lg border border-[#FECACA] font-medium">
                    {errorMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Sign In to {selectedRole?.toUpperCase()} Panel
                </Button>
              </form>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
