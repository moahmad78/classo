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
import { INSTITUTE_TYPES, InstituteType } from '@classo/config';

export default function RegisterInstitutePage() {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checked: boolean;
    available?: boolean;
    error?: string;
  }>({ checked: false });

  const [formData, setFormData] = useState({
    instituteName: '',
    instituteType: 'school' as InstituteType,
    state: '',
    city: '',
    pinCode: '',
    address: '',
    officialPhone: '',
    officialEmail: '',
    principalName: '',
    principalPhone: '',
    principalEmail: '',
    preferredSubdomain: '',
    termsAccepted: false,
  });

  const [applicationId, setApplicationId] = useState<string>('');
  const [emailOtp, setEmailOtp] = useState('123456');
  const [phoneOtp, setPhoneOtp] = useState('123456');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live subdomain check (REG-05)
  const handleCheckSubdomain = async (sub: string) => {
    const trimmed = sub.trim().toLowerCase();
    setFormData((prev) => ({ ...prev, preferredSubdomain: trimmed }));

    if (trimmed.length < 3) {
      setSubdomainStatus({ checked: false });
      return;
    }

    setIsCheckingSubdomain(true);
    try {
      // In dev/demo, check locally or call API
      const reserved = ['admin', 'api', 'www', 'app', 'support'];
      if (reserved.includes(trimmed)) {
        setSubdomainStatus({ checked: true, available: false, error: 'Reserved subdomain' });
      } else if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(trimmed)) {
        setSubdomainStatus({
          checked: true,
          available: false,
          error: 'Only lowercase letters, numbers, and hyphens permitted',
        });
      } else {
        setSubdomainStatus({ checked: true, available: true });
      }
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      alert('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock / Real API call to /api/v1/registration/apply
      const mockAppId = 'app-' + Math.random().toString(36).substring(2, 9);
      setApplicationId(mockAppId);
      setStep('otp');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (emailOtp.length !== 6 || phoneOtp.length !== 6) {
      setOtpError('Please enter valid 6-digit OTPs.');
      return;
    }
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2937] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center space-x-3">
            <a href="/" className="w-10 h-10 rounded-xl bg-[#0F766E] flex items-center justify-center text-white font-bold text-xl font-heading shadow-sm">
              C
            </a>
            <div>
              <h1 className="text-xl font-bold font-heading text-[#0F766E]">
                Classo Self-Service Registration
              </h1>
              <p className="text-xs text-[#6B7280]">
                Register your school, college, or coaching institute in 5 minutes (REG-01)
              </p>
            </div>
          </div>
          <Badge variant="primary">Self-Service Onboarding</Badge>
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Institute Basic Details</CardTitle>
                <p className="text-xs text-[#6B7280]">Official details of the institute</p>
              </CardHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Institute Full Name *"
                  placeholder="e.g. Modern Public Academy"
                  value={formData.instituteName}
                  onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                    Institute Type * (CC-01)
                  </label>
                  <select
                    value={formData.instituteType}
                    onChange={(e) => setFormData({ ...formData, instituteType: e.target.value as InstituteType })}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-lg text-sm text-[#1F2937] focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="school">School (K-12)</option>
                    <option value="college">College / University Department</option>
                    <option value="coaching">Coaching / Test Prep Institute</option>
                  </select>
                </div>

                <Input
                  label="Official Email *"
                  type="email"
                  placeholder="contact@institute.edu"
                  value={formData.officialEmail}
                  onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                  required
                />
                <Input
                  label="Official Phone *"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.officialPhone}
                  onChange={(e) => setFormData({ ...formData, officialPhone: e.target.value })}
                  required
                />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Address & Subdomain</CardTitle>
                <p className="text-xs text-[#6B7280]">Your web address and location</p>
              </CardHeader>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City *"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
                <Input
                  label="State *"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
                <Input
                  label="PIN Code *"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                  required
                />
              </div>

              <div className="mt-4">
                <Input
                  label="Campus Address *"
                  placeholder="Street / Campus Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              {/* Subdomain Input with Live Availability Check (REG-05) */}
              <div className="mt-4 p-4 rounded-lg bg-[#FAF7F2] border border-[#E5E0D8] space-y-2">
                <label className="block text-sm font-semibold text-[#1F2937]">
                  Preferred Institute Subdomain * (REG-05)
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.preferredSubdomain}
                    onChange={(e) => handleCheckSubdomain(e.target.value)}
                    placeholder="e.g. modernacademy"
                    className="min-h-[44px] px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-l-lg text-sm text-[#1F2937] focus:ring-2 focus:ring-[#0F766E] flex-1"
                    required
                  />
                  <span className="px-3.5 py-2.5 bg-[#F3EFEA] border-y border-r border-[#E5E0D8] rounded-r-lg text-sm text-[#6B7280] font-medium">
                    .classo.in
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  {isCheckingSubdomain && <span className="text-[#6B7280]">Checking availability...</span>}
                  {!isCheckingSubdomain && subdomainStatus.checked && subdomainStatus.available && (
                    <Badge variant="success">✓ Subdomain is available and will be reserved for 14 days</Badge>
                  )}
                  {!isCheckingSubdomain && subdomainStatus.checked && !subdomainStatus.available && (
                    <Badge variant="danger">✗ {subdomainStatus.error || 'Subdomain unavailable'}</Badge>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Principal / Director Account (Admin)</CardTitle>
                <p className="text-xs text-[#6B7280]">
                  This account will be created automatically upon approval (REG-08)
                </p>
              </CardHeader>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Principal Full Name *"
                  placeholder="Dr. Rajesh Sharma"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  required
                />
                <Input
                  label="Principal Email *"
                  type="email"
                  placeholder="principal@institute.edu"
                  value={formData.principalEmail}
                  onChange={(e) => setFormData({ ...formData, principalEmail: e.target.value })}
                  required
                />
                <Input
                  label="Principal Mobile Number *"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.principalPhone}
                  onChange={(e) => setFormData({ ...formData, principalPhone: e.target.value })}
                  required
                />
              </div>

              <div className="mt-4 pt-4 border-t border-[#E5E0D8] flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="w-4 h-4 text-[#0F766E] rounded border-[#E5E0D8] focus:ring-[#0F766E]"
                  required
                />
                <label htmlFor="terms" className="text-xs text-[#6B7280]">
                  I confirm that I am authorized to register this institute and agree to Classo's{' '}
                  <span className="text-[#0F766E] font-medium underline">Terms of Service</span> and{' '}
                  <span className="text-[#0F766E] font-medium underline">Privacy Policy (DPDP compliant)</span>.
                </label>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting}>
                Submit Application & Verify OTP
              </Button>
            </div>
          </form>
        )}

        {/* OTP Step (REG-03) */}
        {step === 'otp' && (
          <Card className="p-8 max-w-lg mx-auto text-center space-y-6">
            <CardHeader className="border-none pb-0">
              <Badge variant="warning">Verification Step</Badge>
              <CardTitle className="text-xl mt-2">Verify Email & Mobile OTP (REG-03)</CardTitle>
              <p className="text-sm text-[#6B7280]">
                We sent a 6-digit OTP to {formData.officialEmail} and {formData.officialPhone}.
              </p>
            </CardHeader>

            <div className="space-y-4 text-left">
              <Input
                label="Email OTP (Demo: 123456)"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                maxLength={6}
              />
              <Input
                label="SMS OTP (Demo: 123456)"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value)}
                maxLength={6}
              />
              {otpError && <p className="text-xs text-[#B91C1C] font-semibold">{otpError}</p>}
            </div>

            <Button variant="primary" className="w-full" onClick={handleVerifyOtp}>
              Verify & Submit Application
            </Button>
          </Card>
        )}

        {/* Success / Tracking Step (REG-06) */}
        {step === 'success' && (
          <Card className="p-8 max-w-lg mx-auto text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <CardTitle className="text-2xl text-[#15803D]">
              Application Submitted & Verified!
            </CardTitle>
            <p className="text-sm text-[#1F2937]">
              Your application for <strong>{formData.instituteName}</strong> is now in the Classo Approval Queue (REG-07).
            </p>
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8] text-left text-xs space-y-2 text-[#6B7280]">
              <p>• <strong>Subdomain:</strong> {formData.preferredSubdomain}.classo.in (Reserved 14 days)</p>
              <p>• <strong>Status:</strong> Under Review (SLA &lt; 48 hours)</p>
              <p>• <strong>Principal Account:</strong> {formData.principalEmail} (Invite link will be emailed on approval)</p>
            </div>
            <Button
              variant="accent"
              onClick={() => (window.location.href = '/login')}
            >
              Go to Login Page
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
