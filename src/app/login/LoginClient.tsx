'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnonymousLogin, setShowAnonymousLogin] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { signInWithEmail } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirect);
    }
  };

  const handleAnonymousLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Try to load anonymous credentials from localStorage
    const saved = localStorage.getItem('anonymous-credentials');
    if (!saved) {
      setError('No anonymous account found on this device. Please sign up first.');
      return;
    }

    setLoading(true);
    const { email, password } = JSON.parse(saved);
    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError('Could not log in with saved credentials. Please sign up again.');
      setLoading(false);
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          {!showAnonymousLogin ? (
            <>
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-neutral-900 text-neutral-400">or</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowAnonymousLogin(true)}
                  className="mt-4 w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded border border-neutral-700 transition-colors"
                >
                  Login with Anonymous Account
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-neutral-400 text-sm mb-4">
                If you created an anonymous account on this device, click below to restore it.
              </p>

              <form onSubmit={handleAnonymousLogin} className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Restoring...' : 'Restore Anonymous Account'}
                </button>
              </form>

              <button
                onClick={() => setShowAnonymousLogin(false)}
                className="mt-4 w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded border border-neutral-700 transition-colors"
              >
                Back to Email Login
              </button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-neutral-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-amber-500 hover:text-amber-400">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-400">
            ← Back to curriculum
          </Link>
        </div>
      </div>
    </div>
  );
}
