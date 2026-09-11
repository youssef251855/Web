'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-3xl font-bold text-neutral-100 mb-3">Something went wrong</h1>
      <p className="text-neutral-400 max-w-md mb-6 text-sm">
        An unexpected error occurred while processing your request.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg border border-neutral-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
