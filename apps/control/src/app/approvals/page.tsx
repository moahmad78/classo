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

interface ApplicationItem {
  id: string;
  name: string;
  type: 'school' | 'college' | 'coaching';
  city: string;
  state: string;
  subdomain: string;
  principalName: string;
  principalEmail: string;
  submittedAt: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  hoursRemaining: number;
}

export default function ApprovalsQueuePage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([
    {
      id: 'app-01',
      name: 'Greenwood High School',
      type: 'school',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      subdomain: 'greenwood',
      principalName: 'Dr. V. Verma',
      principalEmail: 'principal@greenwood.edu',
      submittedAt: '2026-10-02 14:30',
      status: 'under_review',
      hoursRemaining: 24,
    },
    {
      id: 'app-02',
      name: 'Apex Physics Classes',
      type: 'coaching',
      city: 'Kota',
      state: 'Rajasthan',
      subdomain: 'apexphysics',
      principalName: 'R. K. Agrawal',
      principalEmail: 'director@apexphysics.com',
      submittedAt: '2026-10-03 08:15',
      status: 'under_review',
      hoursRemaining: 46,
    },
    {
      id: 'app-03',
      name: 'National College of Commerce',
      type: 'college',
      city: 'Indore',
      state: 'Madhya Pradesh',
      subdomain: 'nccindore',
      principalName: 'Prof. S. Joshi',
      principalEmail: 'principal@nccindore.edu',
      submittedAt: '2026-10-01 10:00',
      status: 'under_review',
      hoursRemaining: 8,
    },
  ]);

  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(applications[0]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalResult, setApprovalResult] = useState<any>(null);

  // PRD REG-08: Approve routine
  const handleApprove = (app: ApplicationItem) => {
    // Generate unique institute code and invite link
    const code = `${app.subdomain.substring(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;
    const inviteToken = 'token_' + Math.random().toString(36).substring(2, 15);
    const inviteLink = `https://${app.subdomain}.classo.in/set-password?token=${inviteToken}`;

    setApprovalResult({
      instituteName: app.name,
      subdomain: `${app.subdomain}.classo.in`,
      code,
      principalEmail: app.principalEmail,
      inviteLink,
      status: 'trial (14 days)',
    });

    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: 'approved' } : a))
    );
  };

  // PRD REG-09: Reject routine
  const handleReject = () => {
    if (!selectedApp || !rejectionReason.trim()) {
      alert('Mandatory rejection reason must be provided (REG-07).');
      return;
    }

    setApplications((prev) =>
      prev.map((a) => (a.id === selectedApp.id ? { ...a, status: 'rejected' } : a))
    );
    setShowRejectModal(false);
    alert(`Application for ${selectedApp.name} rejected. Reserved subdomain '${selectedApp.subdomain}' has been released (REG-09).`);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div>
            <h1 className="text-2xl font-bold font-heading text-[#0F766E]">
              Registration Approval Queue (REG-07)
            </h1>
            <p className="text-xs text-[#6B7280]">
              Review self-registered institutes • Target SLA: &le; 48 hours
            </p>
          </div>
          <a href="/">
            <Button variant="outline" size="sm">
              ← Control Center Home
            </Button>
          </a>
        </div>

        {/* Approval Success Banner (REG-08) */}
        {approvalResult && (
          <Card className="p-6 bg-[#DCFCE7]/40 border-[#BBF7D0] space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="success">REG-08 Auto-Creation Succeeded</Badge>
              <span className="text-sm font-bold text-[#15803D]">
                Institute & Principal Account Created!
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-lg border border-[#BBF7D0]">
              <div>
                <p className="text-[#6B7280]">Institute:</p>
                <p className="font-bold text-[#1F2937]">{approvalResult.instituteName}</p>
              </div>
              <div>
                <p className="text-[#6B7280]">Subdomain & Code:</p>
                <p className="font-bold text-[#0F766E]">{approvalResult.subdomain} ({approvalResult.code})</p>
              </div>
              <div>
                <p className="text-[#6B7280]">Status:</p>
                <p className="font-bold text-[#15803D]">{approvalResult.status}</p>
              </div>
              <div>
                <p className="text-[#6B7280]">Principal Account:</p>
                <p className="font-bold text-[#1F2937]">{approvalResult.principalEmail}</p>
              </div>
            </div>
            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E5E0D8] text-xs">
              <span className="font-bold text-[#1F2937]">One-Time Invite Link (Valid 72h): </span>
              <code className="text-[#0F766E]">{approvalResult.inviteLink}</code>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-bold font-heading text-[#1F2937]">
              Pending Queue ({applications.filter((a) => a.status === 'under_review').length})
            </h2>

            {applications.map((app) => (
              <Card
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedApp?.id === app.id
                    ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 bg-white'
                    : 'bg-white opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1F2937]">{app.name}</span>
                  <Badge variant={app.hoursRemaining < 12 ? 'danger' : 'warning'}>
                    {app.hoursRemaining}h SLA
                  </Badge>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  {app.city}, {app.state} • {app.type.toUpperCase()}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#FAF7F2] text-[11px]">
                  <span className="text-[#0F766E] font-medium">{app.subdomain}.classo.in</span>
                  <span className="capitalize font-semibold text-[#1F2937]">{app.status.replace('_', ' ')}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Details & Review Actions */}
          <div className="lg:col-span-2">
            {selectedApp ? (
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
                  <div>
                    <h2 className="text-xl font-bold font-heading text-[#1F2937]">
                      {selectedApp.name}
                    </h2>
                    <p className="text-xs text-[#0F766E] font-semibold mt-0.5">
                      https://{selectedApp.subdomain}.classo.in • Type: {selectedApp.type.toUpperCase()}
                    </p>
                  </div>
                  <Badge variant={selectedApp.status === 'approved' ? 'success' : 'warning'}>
                    {selectedApp.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Verification Checklist */}
                <div>
                  <h3 className="text-sm font-bold text-[#1F2937] mb-2">
                    Verification Checklist (CTL-02)
                  </h3>
                  <div className="space-y-2 text-xs text-[#1F2937]">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded text-[#0F766E]" />
                      <span>Official Phone & Email Verified via OTP (REG-03)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded text-[#0F766E]" />
                      <span>Subdomain is valid and reserved (REG-05)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded text-[#0F766E]" />
                      <span>Principal credentials and ID proof verified</span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
                  <div>
                    <p className="text-[#6B7280]">Principal Name:</p>
                    <p className="font-bold text-[#1F2937]">{selectedApp.principalName}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Principal Email:</p>
                    <p className="font-bold text-[#1F2937]">{selectedApp.principalEmail}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Location:</p>
                    <p className="font-bold text-[#1F2937]">{selectedApp.city}, {selectedApp.state}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Submitted At:</p>
                    <p className="font-bold text-[#1F2937]">{selectedApp.submittedAt}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D8]">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowRejectModal(true)}
                  >
                    Reject Application (REG-09)
                  </Button>

                  <div className="space-x-3">
                    <Button variant="outline" size="sm">
                      Request More Info
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(selectedApp)}
                    >
                      ✓ Approve Institute (REG-08)
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center text-[#6B7280]">
                Select an application from the queue to review
              </Card>
            )}
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full p-6 space-y-4">
              <CardHeader className="border-none pb-0">
                <CardTitle className="text-lg text-[#B91C1C]">
                  Reject Application (REG-09)
                </CardTitle>
                <p className="text-xs text-[#6B7280]">
                  Rejection reason is mandatory and will be emailed to the applicant.
                </p>
              </CardHeader>

              <Input
                label="Rejection Reason *"
                placeholder="e.g. Incomplete registration documents provided"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={handleReject}>
                  Confirm Rejection & Release Subdomain
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
