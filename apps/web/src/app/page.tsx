'use client';

import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, Badge, Input, formatINR, MICROCOPY } from '@classo/ui';

export default function HomePage() {
  const [instituteCode, setInstituteCode] = useState('');
  const [locale, setLocale] = useState<'en' | 'hi-en'>('hi-en');

  const copy = MICROCOPY[locale];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937]">
      {/* Top Header */}
      <header className="border-b border-[#E5E0D8] bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-xl font-heading shadow-sm">
              C
            </div>
            <div>
              <span className="font-heading font-extrabold text-2xl text-[#0F766E] tracking-tight">
                Classo
              </span>
              <span className="hidden sm:inline ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">
                v1.1 Foundation
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Toggle */}
            <div className="flex items-center bg-[#FAF7F2] p-1 rounded-lg border border-[#E5E0D8] text-xs font-medium">
              <button
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  locale === 'en' ? 'bg-white shadow-xs font-bold text-[#0F766E]' : 'text-[#6B7280]'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLocale('hi-en')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  locale === 'hi-en' ? 'bg-white shadow-xs font-bold text-[#0F766E]' : 'text-[#6B7280]'
                }`}
              >
                हिंदी / Hinglish
              </button>
            </div>

            <Button
              variant="accent"
              size="sm"
              onClick={() => alert('Phase 1 Self-Service Registration starting now!')}
            >
              Register Institute
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Badge variant="primary" className="mb-2">
            Multi-Tenant Institute Operating System
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-[#1F2937] tracking-tight leading-tight">
            One software for your School, College, or Coaching
          </h1>
          <p className="text-lg text-[#6B7280] font-normal">
            Admissions, attendance, fees, salary, homework, and reports — all in one warm, fast, and secure place.
          </p>
        </div>

        {/* Login & Institute Resolution Box (PRD USR-01) */}
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <CardHeader className="text-center border-none pb-2">
              <CardTitle className="text-xl">Enter Your Institute</CardTitle>
              <p className="text-sm text-[#6B7280] mt-1">
                Enter your institute code (e.g. DPS001) or open your institute subdomain.
              </p>
            </CardHeader>
            <div className="space-y-4 mt-2">
              <Input
                label="Institute Code"
                placeholder="e.g. DPS001 or STX001"
                value={instituteCode}
                onChange={(e) => setInstituteCode(e.target.value.toUpperCase())}
              />
              <Button
                variant="primary"
                className="w-full"
                onClick={() => alert(`Resolving institute code: ${instituteCode || 'DPS001'}...`)}
              >
                Continue to Login
              </Button>

              <div className="pt-2 text-center border-t border-[#E5E0D8]">
                <p className="text-xs text-[#6B7280]">
                  New institute?{' '}
                  <a
                    href="#register"
                    className="text-[#0F766E] font-bold hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Phase 1 Registration will open /register flow.');
                    }}
                  >
                    Self-Register your institute
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Foundation Features & Tone Showcase (PRD Section 14) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <Card>
            <CardHeader>
              <Badge variant="success">ISO-01 & ISO-02 Validated</Badge>
              <CardTitle className="text-base mt-2">Zero Cross-Tenant Leakage</CardTitle>
            </CardHeader>
            <p className="text-sm text-[#6B7280]">
              PostgreSQL Row Level Security (RLS) is strictly enforced at the database level. Tenant records are 100% isolated.
            </p>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="warning">Indian Education Friendly</Badge>
              <CardTitle className="text-base mt-2">Human & Warm Microcopy</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm text-[#1F2937] bg-[#FAF7F2] p-3 rounded-lg border border-[#E5E0D8]">
              <p className="font-semibold text-xs text-[#6B7280]">Sample Active Microcopy:</p>
              <p className="italic">"{copy.attendance.saved(2)}"</p>
              <p className="italic">"{copy.fees.dueReminder(formatINR(250000).replace('₹ ', ''), '10 Oct')}"</p>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="neutral">Pre-auth Hostile Hardening</Badge>
              <CardTitle className="text-base mt-2">Anti-Abuse & Rate Limiting</CardTitle>
            </CardHeader>
            <p className="text-sm text-[#6B7280]">
              Public registration and tenant resolution are protected against user enumeration, brute-force attempts, and spoofing.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
