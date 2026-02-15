'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

export default function ProfileClient() {
  const { user, profile, isLoading, signOut, refreshProfile, isAdmin } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [showProgress, setShowProgress] = useState(true);
  const [showLocation, setShowLocation] = useState(false);
  const [showAchievements, setShowAchievements] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      const privacy = profile.privacy_settings as {
        show_progress?: boolean;
        show_location?: boolean;
        show_achievements?: boolean;
      };
      setShowProgress(privacy?.show_progress ?? true);
      setShowLocation(privacy?.show_location ?? false);
      setShowAchievements(privacy?.show_achievements ?? true);
    }
  }, [profile]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio,
        location,
        privacy_settings: {
          show_progress: showProgress,
          show_location: showLocation,
          show_achievements: showAchievements,
        },
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-neutral-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-neutral-400 hover:text-white transition-colors">
            ← Back to curriculum
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1 bg-red-900/50 text-red-300 rounded text-sm hover:bg-red-900/70 transition-colors"
            >
              Admin Panel
            </Link>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                {(profile.display_name || profile.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-neutral-300">@{profile.username}</p>
                {profile.is_anonymous && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-400">
                    Anonymous Account
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {message && (
              <div
                className={`p-3 rounded text-sm ${
                  message.type === 'success'
                    ? 'bg-green-900/50 border border-green-700 text-green-200'
                    : 'bg-red-900/50 border border-red-700 text-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Profile Info */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    placeholder="Tell others about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Los Angeles, Berlin, Tehran"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Helps find study partners in your area
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Privacy Settings</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showProgress}
                    onChange={(e) => setShowProgress(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900"
                  />
                  <span className="text-neutral-300">Show my progress to other users</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showAchievements}
                    onChange={(e) => setShowAchievements(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900"
                  />
                  <span className="text-neutral-300">Show my achievements</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900"
                  />
                  <span className="text-neutral-300">Show my location</span>
                </label>
              </div>
            </div>

            {/* Account Info */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
              <div className="space-y-2 text-sm text-neutral-400">
                <p>
                  <span className="text-neutral-500">Username:</span> @{profile.username}
                </p>
                <p>
                  <span className="text-neutral-500">Member since:</span>{' '}
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
                {!profile.is_anonymous && user.email && (
                  <p>
                    <span className="text-neutral-500">Email:</span> {user.email}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded border border-neutral-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Data Management</h2>
          <p className="text-sm text-neutral-400 mb-4">
            Your progress is synced to the cloud. You can also export a backup or delete your account.
          </p>
          <div className="flex gap-3">
            <Link
              href="/progress"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded border border-neutral-700 transition-colors"
            >
              View Progress
            </Link>
            <button className="px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-300 font-medium rounded border border-red-800 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
