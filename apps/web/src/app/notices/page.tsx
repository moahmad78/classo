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

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  audienceType: 'all' | 'role' | 'class';
  targetAudience: string[];
  publishDate: string;
  attachments?: Array<{ name: string; size: string }>;
  isRead: boolean;
  authorName: string;
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'attendance' | 'notice' | 'general';
  time: string;
  isRead: boolean;
}

export default function NoticesPage() {
  const [activeTab, setActiveTab] = useState<'board' | 'notifications'>('board');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [showNewNoticeModal, setShowNewNoticeModal] = useState(false);

  // Notices state (COM-01)
  const [notices, setNotices] = useState<NoticeItem[]>([
    {
      id: 'n-1',
      title: 'Upcoming Half-Yearly Examinations Schedule',
      content:
        'Half-yearly examinations for Classes 8 to 12 will commence on October 20, 2026. Detailed subject-wise syllabus and hall ticket distribution will begin next Monday.',
      audienceType: 'all',
      targetAudience: ['All Students & Parents'],
      publishDate: '2026-10-03',
      attachments: [{ name: 'Half_Yearly_Schedule_2026.pdf', size: '1.2 MB' }],
      isRead: false,
      authorName: 'Principal Office',
    },
    {
      id: 'n-2',
      title: 'Faculty Meeting: Science Department Curricular Review',
      content:
        'All teachers from the Physics, Chemistry, and Biology departments are requested to assemble in Conference Hall B at 3:30 PM today for curriculum review.',
      audienceType: 'role',
      targetAudience: ['Teacher'],
      publishDate: '2026-10-03',
      isRead: true,
      authorName: 'Academic Coordinator',
    },
    {
      id: 'n-3',
      title: 'Parent-Teacher Meeting (PTM) for Class 10',
      content:
        'Term 1 progress discussions with parents of Class 10 Sections A & B will be held this Saturday between 9:00 AM and 1:00 PM.',
      audienceType: 'class',
      targetAudience: ['Class 10 - All Sections'],
      publishDate: '2026-10-02',
      isRead: true,
      authorName: 'Headmistress',
    },
  ]);

  // Notifications state (COM-05)
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Absence Alert (ATT-03)',
      message: 'Aarav Patel was marked absent on 2026-10-03. Parent notified automatically.',
      type: 'attendance',
      time: '10:15 AM',
      isRead: false,
    },
    {
      id: 'notif-2',
      title: 'Substitution Assigned (TT-03)',
      message: 'You have been assigned to cover Period 2 Physics for Priya Verma today.',
      type: 'general',
      time: '09:05 AM',
      isRead: false,
    },
    {
      id: 'notif-3',
      title: 'New Circular Published',
      message: 'Half-yearly examination schedule has been published on the notice board.',
      type: 'notice',
      time: '08:30 AM',
      isRead: true,
    },
  ]);

  // New Notice form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAudienceType, setNewAudienceType] = useState<'all' | 'role' | 'class'>('all');
  const [newAudienceTarget, setNewAudienceTarget] = useState('All Institute Users');

  const handleCreateNotice = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const created: NoticeItem = {
      id: `n-${Date.now()}`,
      title: newTitle,
      content: newContent,
      audienceType: newAudienceType,
      targetAudience: [newAudienceTarget],
      publishDate: '2026-10-03',
      isRead: true,
      authorName: 'Principal Office',
    };

    setNotices([created, ...notices]);
    setShowNewNoticeModal(false);
    setNewTitle('');
    setNewContent('');

    // Trigger notification to app feed
    const alert: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `Notice: ${newTitle}`,
      message: newContent.length > 80 ? `${newContent.slice(0, 77)}...` : newContent,
      type: 'notice',
      time: 'Just now',
      isRead: false,
    };
    setNotifications([alert, ...notifications]);
  };

  const markNoticeRead = (id: string) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotices = notices.filter((n) => {
    if (audienceFilter === 'all') return true;
    return n.audienceType === audienceFilter;
  });

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
                  Communication Hub
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">Notice Board & Notifications</p>
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
            >
              Timetable
            </a>
            <a
              href="/notices"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F766E] text-white"
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
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'board'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              📢 Notice Board (COM-01)
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'notifications'
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'bg-white text-[#6B7280] hover:bg-[#FAF7F2] border border-[#E5E0D8]'
              }`}
            >
              <span>🔔 In-App Alerts (COM-05)</span>
              {unreadNotifsCount > 0 && (
                <span className="bg-[#B91C1C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'board' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNewNoticeModal(true)}
            >
              + Publish New Notice
            </Button>
          )}

          {activeTab === 'notifications' && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsRead}
            >
              Mark All as Read
            </Button>
          )}
        </div>

        {/* ============================================================= */}
        {/* NOTICE BOARD                                                 */}
        {/* ============================================================= */}
        {activeTab === 'board' && (
          <div className="space-y-6">
            {/* Filter Pills */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAudienceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  audienceFilter === 'all'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white text-[#6B7280] border border-[#E5E0D8]'
                }`}
              >
                All Audiences
              </button>
              <button
                onClick={() => setAudienceFilter('role')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  audienceFilter === 'role'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white text-[#6B7280] border border-[#E5E0D8]'
                }`}
              >
                Faculty / Staff Specific
              </button>
              <button
                onClick={() => setAudienceFilter('class')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  audienceFilter === 'class'
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-white text-[#6B7280] border border-[#E5E0D8]'
                }`}
              >
                Class-Specific Notices
              </button>
            </div>

            {/* Notices List */}
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <Card key={notice.id} className="p-6 space-y-4 relative">
                  {!notice.isRead && (
                    <span className="absolute top-4 right-4 bg-[#B91C1C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      NEW UNREAD
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">
                      {notice.audienceType.toUpperCase()}: {notice.targetAudience.join(', ')}
                    </Badge>
                    <span className="text-xs text-[#6B7280]">
                      Published by <strong>{notice.authorName}</strong> on {notice.publishDate}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">{notice.title}</h3>
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{notice.content}</p>
                  </div>

                  {notice.attachments && notice.attachments.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-[#6B7280] uppercase mb-1.5">
                        Attachments:
                      </p>
                      <div className="flex items-center space-x-2">
                        {notice.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="bg-[#FAF7F2] border border-[#E5E0D8] px-3 py-1.5 rounded-lg flex items-center space-x-2 text-xs"
                          >
                            <span>📎</span>
                            <span className="font-semibold text-[#0F766E]">{att.name}</span>
                            <span className="text-[10px] text-[#6B7280]">({att.size})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!notice.isRead && (
                    <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markNoticeRead(notice.id)}
                      >
                        Mark as Read (Receipt)
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* IN-APP NOTIFICATIONS FEED                                    */}
        {/* ============================================================= */}
        {activeTab === 'notifications' && (
          <Card className="divide-y divide-[#E5E0D8]">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !item.isRead ? 'bg-[#FAF7F2]' : 'bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      item.type === 'attendance'
                        ? 'bg-[#B91C1C]/10 text-[#B91C1C]'
                        : item.type === 'notice'
                        ? 'bg-[#0F766E]/10 text-[#0F766E]'
                        : 'bg-[#F59E0B]/10 text-[#B45309]'
                    }`}
                  >
                    {item.type === 'attendance' && '🚨'}
                    {item.type === 'notice' && '📢'}
                    {item.type === 'general' && '⚡'}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-[#1F2937]">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#B91C1C]" />
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">{item.message}</p>
                    <span className="text-[10px] text-[#6B7280]">{item.time}</span>
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    onClick={() => markNotificationRead(item.id)}
                    className="text-xs font-semibold text-[#0F766E] hover:underline shrink-0"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </Card>
        )}
      </main>

      {/* New Notice Modal */}
      {showNewNoticeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-[#1F2937]">Publish New Notice (COM-01)</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">
                  Notice Title
                </label>
                <Input
                  placeholder="e.g. Sports Day Registration and Practice Schedule"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">
                  Target Audience
                </label>
                <select
                  value={newAudienceType}
                  onChange={(e) => {
                    const val = e.target.value as 'all' | 'role' | 'class';
                    setNewAudienceType(val);
                    if (val === 'all') setNewAudienceTarget('All Institute Users');
                    else if (val === 'role') setNewAudienceTarget('Teachers & Faculty');
                    else setNewAudienceTarget('Class 10 (All Sections)');
                  }}
                  className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs font-semibold"
                >
                  <option value="all">Broadcast to Everyone (All Users)</option>
                  <option value="role">Role Targeted (Faculty / Staff)</option>
                  <option value="class">Class Targeted (Class 10)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1">
                  Notice Content
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter notice details..."
                  className="w-full px-3 py-2 border border-[#E5E0D8] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E0D8]">
              <Button variant="outline" size="sm" onClick={() => setShowNewNoticeModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newTitle.trim() || !newContent.trim()}
                onClick={handleCreateNotice}
              >
                Publish & Broadcast
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
