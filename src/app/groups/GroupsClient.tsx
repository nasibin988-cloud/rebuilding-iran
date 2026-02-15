'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type StudyGroup = Database['public']['Tables']['study_groups']['Row'] & {
  member_count?: number;
  is_member?: boolean;
  creator?: {
    username: string;
    display_name: string | null;
  };
};

export default function GroupsClient() {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all public groups with member counts
      const { data: publicGroups, error: publicError } = await supabase
        .from('study_groups')
        .select(`
          *,
          creator:profiles!study_groups_created_by_fkey(username, display_name),
          group_members(count)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      const groupsWithCounts = (publicGroups || []).map(g => ({
        ...g,
        member_count: g.group_members?.[0]?.count || 0,
        creator: g.creator,
      }));

      setGroups(groupsWithCounts);

      // If user is logged in, fetch their groups
      if (user) {
        const { data: membershipData, error: memberError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            role,
            study_groups(
              *,
              creator:profiles!study_groups_created_by_fkey(username, display_name),
              group_members(count)
            )
          `)
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        const userGroups: StudyGroup[] = (membershipData || [])
          .filter(m => m.study_groups)
          .map(m => {
            const sg = m.study_groups as unknown as Record<string, unknown>;
            const groupMembers = sg?.group_members as Array<{ count: number }> | undefined;
            return {
              id: sg.id as string,
              name: sg.name as string,
              description: sg.description as string | null,
              created_by: sg.created_by as string,
              is_private: sg.is_private as boolean,
              created_at: sg.created_at as string,
              member_count: groupMembers?.[0]?.count || 0,
              is_member: true,
              creator: sg?.creator as { username: string; display_name: string | null } | undefined,
            };
          });

        setMyGroups(userGroups);

        // Mark groups user is a member of
        const memberGroupIds = new Set(userGroups.map(g => g.id));
        setGroups(prev => prev.map(g => ({
          ...g,
          is_member: memberGroupIds.has(g.id),
        })));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const filteredGroups = (activeTab === 'my' ? myGroups : groups).filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Groups</h1>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Create Group
          </button>
        )}
      </div>

      {!user && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200">
            <Link href="/login" className="font-medium underline">Sign in</Link> to create or join study groups.
          </p>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All Groups
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'my'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              My Groups ({myGroups.length})
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Groups List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading groups...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {activeTab === 'my' ? "You haven't joined any groups yet." : 'No groups found.'}
          </p>
          {activeTab === 'my' && (
            <button
              onClick={() => setActiveTab('all')}
              className="text-emerald-600 hover:underline"
            >
              Browse all groups
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/groups/${group.id}`}
                    className="text-xl font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    {group.name}
                  </Link>
                  {group.is_private && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      Private
                    </span>
                  )}
                  {group.description && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{group.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{group.member_count} member{group.member_count !== 1 ? 's' : ''}</span>
                    <span>Created by {group.creator?.display_name || group.creator?.username || 'Unknown'}</span>
                  </div>
                </div>
                {user && (
                  <div className="ml-4">
                    {group.is_member ? (
                      <div className="flex gap-2">
                        <Link
                          href={`/groups/${group.id}`}
                          className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                          Open
                        </Link>
                        <button
                          onClick={() => handleLeaveGroup(group.id)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          Leave
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Join
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}

function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          created_by: user.id,
          is_private: isPrivate,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      onCreated();
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Study Group</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Section 1 Discussion"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Make this group private (invite-only)
            </span>
          </label>

          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
