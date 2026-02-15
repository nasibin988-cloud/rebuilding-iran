'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';

export default function UserMenu() {
  const { user, profile, isLoading, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="w-8 h-8 bg-neutral-800 rounded-full animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-800 transition-colors"
      >
        <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-sm font-medium text-white">
          {initial}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 z-50">
          <div className="px-4 py-3 border-b border-neutral-800">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-neutral-400 truncate">@{profile?.username}</p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/progress"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              My Progress
            </Link>
            <Link
              href="/bookmarks"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              Bookmarks
            </Link>
          </div>

          {isAdmin && (
            <div className="py-1 border-t border-neutral-800">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 transition-colors"
              >
                Admin Panel
              </Link>
            </div>
          )}

          <div className="py-1 border-t border-neutral-800">
            <button
              onClick={async () => {
                await signOut();
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
