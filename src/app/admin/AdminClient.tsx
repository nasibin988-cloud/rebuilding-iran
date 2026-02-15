'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

type Tab = 'reports' | 'users' | 'news' | 'stats';

interface Report {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { username: string };
  discussion?: { content: string; user: { username: string } };
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
  last_active: string;
}

export default function AdminClient() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalDiscussions: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [isLoading, user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);

    if (activeTab === 'reports') {
      const { data } = await supabase
        .from('reports')
        .select(`
          id, reason, status, created_at,
          reporter:profiles!reporter_id(username),
          discussion:discussions(content, user:profiles(username))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setReports((data as unknown as Report[]) || []);
    } else if (activeTab === 'users') {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, is_admin, created_at, last_active')
        .order('created_at', { ascending: false })
        .limit(100);

      setUsers((data as UserProfile[]) || []);
    } else if (activeTab === 'stats') {
      const today = new Date().toISOString().slice(0, 10);

      const [usersRes, activeRes, discussionsRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_active', today),
        supabase.from('discussions').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        activeToday: activeRes.count || 0,
        totalDiscussions: discussionsRes.count || 0,
        pendingReports: reportsRes.count || 0,
      });
    }

    setLoading(false);
  };

  const resolveReport = async (reportId: string, action: 'dismissed' | 'resolved') => {
    await supabase
      .from('reports')
      .update({ status: action, resolved_at: new Date().toISOString() })
      .eq('id', reportId);

    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action } : r));
  };

  const hideDiscussion = async (discussionId: string) => {
    await supabase
      .from('discussions')
      .update({ is_hidden: true })
      .eq('id', discussionId);
  };

  const banUser = async (userId: string, reason: string, permanent: boolean) => {
    await supabase.from('user_bans').insert({
      user_id: userId,
      reason,
      banned_by: user!.id,
      is_permanent: permanent,
      banned_until: permanent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-neutral-400">Manage users, reports, and content</p>
          </div>
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors">
            ← Back to app
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-neutral-900 rounded-lg p-1 w-fit">
          {(['stats', 'reports', 'users', 'news'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-amber-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                  <p className="text-neutral-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                  <p className="text-neutral-400 text-sm">Active Today</p>
                  <p className="text-3xl font-bold text-green-400">{stats.activeToday}</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                  <p className="text-neutral-400 text-sm">Total Discussions</p>
                  <p className="text-3xl font-bold text-white">{stats.totalDiscussions}</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                  <p className="text-neutral-400 text-sm">Pending Reports</p>
                  <p className="text-3xl font-bold text-red-400">{stats.pendingReports}</p>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
                    <p className="text-neutral-400">No reports to review</p>
                  </div>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              report.status === 'pending'
                                ? 'bg-yellow-900/50 text-yellow-300'
                                : report.status === 'resolved'
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-neutral-700 text-neutral-300'
                            }`}>
                              {report.status}
                            </span>
                            <span className="text-xs text-neutral-500">
                              Reported by @{report.reporter?.username}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white mb-2">{report.reason}</p>
                          {report.discussion && (
                            <div className="mt-2 p-3 bg-neutral-800 rounded text-sm">
                              <p className="text-neutral-400 text-xs mb-1">
                                Content by @{report.discussion.user?.username}:
                              </p>
                              <p className="text-neutral-200">{report.discussion.content}</p>
                            </div>
                          )}
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => resolveReport(report.id, 'resolved')}
                              className="px-3 py-1 bg-green-900/50 text-green-300 rounded text-sm hover:bg-green-900/70 transition-colors"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => resolveReport(report.id, 'dismissed')}
                              className="px-3 py-1 bg-neutral-700 text-neutral-300 rounded text-sm hover:bg-neutral-600 transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Last Active</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase">Role</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-neutral-800/50">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{u.display_name || u.username}</p>
                          <p className="text-neutral-500 text-sm">@{u.username}</p>
                        </td>
                        <td className="px-4 py-3 text-neutral-400 text-sm">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-neutral-400 text-sm">
                          {new Date(u.last_active).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {u.is_admin ? (
                            <span className="px-2 py-0.5 bg-red-900/50 text-red-300 rounded text-xs">Admin</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-neutral-700 text-neutral-300 rounded text-xs">User</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!u.is_admin && (
                            <button
                              onClick={() => {
                                if (confirm('Ban this user for 24 hours?')) {
                                  banUser(u.id, 'Manual ban by admin', false);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
                <h2 className="text-lg font-semibold text-white mb-4">News Submission</h2>
                <p className="text-neutral-400 mb-6">
                  Submit news content from Telegram channels. The AI will process, deduplicate, and format it.
                </p>
                <Link
                  href="/admin/news"
                  className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors"
                >
                  Go to News Editor
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
