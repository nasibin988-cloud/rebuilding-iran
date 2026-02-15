'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';

type AccountType = 'email' | 'anonymous';

export default function SignupClient() {
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { signUpWithEmail, signUpAnonymous } = useAuth();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUpWithEmail(email, password, username);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess('Account created! Check your email to verify your account.');
      setLoading(false);
    }
  };

  const handleAnonymousSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUpAnonymous(username);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-md">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-neutral-400 mb-6">{success}</p>
            <Link
              href="/login"
              className="inline-block py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          {!accountType ? (
            <div className="space-y-4">
              <p className="text-neutral-400 text-center mb-6">
                Choose how you want to create your account
              </p>

              <button
                onClick={() => setAccountType('email')}
                className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Email Account</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Sign up with email and password. Recover your account on any device.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setAccountType('anonymous')}
                className="w-full p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Anonymous Account</h3>
                    <p className="text-sm text-neutral-400 mt-1">
                      Just pick a username. No email required. Only works on this device.
                    </p>
                  </div>
                </div>
              </button>

              <div className="pt-4 border-t border-neutral-800">
                <p className="text-sm text-neutral-500 text-center">
                  Your privacy is important. We never share your data.
                </p>
              </div>
            </div>
          ) : accountType === 'email' ? (
            <>
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Choose a username"
                    required
                  />
                  <p className="mt-1 text-xs text-neutral-500">This is how you&apos;ll appear to others</p>
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <button
                onClick={() => setAccountType(null)}
                className="mt-4 w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded border border-neutral-700 transition-colors"
              >
                ← Back
              </button>
            </>
          ) : (
            <>
              <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded text-amber-200 text-sm">
                <strong>Important:</strong> Anonymous accounts are stored only on this device.
                If you clear your browser data, you&apos;ll lose access to this account.
              </div>

              <form onSubmit={handleAnonymousSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Choose a Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Your username"
                    required
                  />
                  <p className="mt-1 text-xs text-neutral-500">This is how you&apos;ll appear to others</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create Anonymous Account'}
                </button>
              </form>

              <button
                onClick={() => setAccountType(null)}
                className="mt-4 w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded border border-neutral-700 transition-colors"
              >
                ← Back
              </button>
            </>
          )}

          <p className="mt-6 text-center text-sm text-neutral-400">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-500 hover:text-amber-400">
              Sign in
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
