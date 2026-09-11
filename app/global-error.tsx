'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white flex flex-col items-center justify-center min-h-screen px-4 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100">Something went wrong</h2>
          <p className="text-neutral-400 text-sm">
            {error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
