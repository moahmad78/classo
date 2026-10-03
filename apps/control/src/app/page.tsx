'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, Badge, Button } from '@classo/ui';

export default function ControlCenterHome() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937]">
      {/* Top Navbar */}
      <header className="border-b border-[#E5E0D8] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#0F766E] flex items-center justify-center text-white font-bold font-heading">
              C
            </div>
            <div>
              <span className="font-heading font-extrabold text-xl text-[#0F766E]">
                Classo Control Center
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3EFEA] text-[#1F2937]">
                Internal Staff Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="success">All Systems Operational</Badge>
            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E5E0D8] flex items-center justify-center text-xs font-bold text-[#0F766E]">
              OA
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1F2937]">
            Platform Overview
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage live institutes, subscription plans, approvals, and platform health.
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Pending Approvals (REG-07)
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold font-heading text-[#B45309]">3</span>
              <Badge variant="warning">&lt; 48h SLA</Badge>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">New institutes awaiting verification</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Active Institutes
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold font-heading text-[#0F766E]">128</span>
              <Badge variant="success">+12 this month</Badge>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">Schools: 64, Colleges: 28, Coaching: 36</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Platform Monthly Revenue
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold font-heading text-[#1F2937]">₹ 8.4L</span>
              <Badge variant="primary">MRR</Badge>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">Paid subscribers + Message top-ups</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              Tenant Leak Incidents
            </p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold font-heading text-[#15803D]">0</span>
              <Badge variant="success">RLS Enforced</Badge>
            </div>
            <p className="text-xs text-[#6B7280] mt-2">100% tenant isolation maintained</p>
          </Card>
        </div>

        {/* Quick Actions & Approval Queue Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Institute Registration Queue (REG-07)</CardTitle>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Applications submitted via self-registration awaiting review
                </p>
              </div>
              <Button size="sm" variant="outline">
                View Full Queue
              </Button>
            </CardHeader>

            <div className="divide-y divide-[#E5E0D8]">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1F2937]">Greenwood High School</p>
                  <p className="text-xs text-[#6B7280]">
                    Lucknow, Uttar Pradesh • greenwood.classo.in • Principal: Dr. V. Verma
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="warning">Under Review</Badge>
                  <Button size="sm" variant="primary">Review</Button>
                </div>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1F2937]">Apex Physics Classes</p>
                  <p className="text-xs text-[#6B7280]">
                    Kota, Rajasthan • apexphysics.classo.in • Director: R. K. Agrawal
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="primary">New (1h ago)</Badge>
                  <Button size="sm" variant="primary">Review</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Control Center Modules</CardTitle>
              <p className="text-xs text-[#6B7280] mt-0.5">Quick access to company tools</p>
            </CardHeader>
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF7F2] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1F2937]">Feature Flags (CTL-06)</span>
                <span className="text-xs text-[#0F766E] font-bold">14 Active</span>
              </div>
              <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF7F2] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1F2937]">Release Manager (CTL-07)</span>
                <span className="text-xs text-[#0F766E] font-bold">v1.1 Pilot</span>
              </div>
              <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF7F2] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1F2937]">Message Wallet (CTL-09)</span>
                <span className="text-xs text-[#15803D] font-bold">Healthy</span>
              </div>
              <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF7F2] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1F2937]">Audit Logs (CTL-17)</span>
                <span className="text-xs text-[#6B7280]">Immutable</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
