'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-8.486 8.486a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656M12 12h.01"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          You&apos;re Offline
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry - any progress you&apos;ve made will be saved and synced when you&apos;re back online.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
          >
            Try Again
          </button>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Some content may still be available from cache. Try navigating to previously viewed pages.
          </p>
        </div>
      </div>
    </div>
  );
}
