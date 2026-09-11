import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-7xl font-extrabold text-neutral-200 tracking-tight mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-neutral-300 mb-4">Page Not Found</h2>
      <p className="text-neutral-400 max-w-md mb-8 text-sm leading-relaxed">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm font-medium rounded-lg border border-neutral-700 transition-colors shadow-sm"
      >
        Back to Home
      </Link>
    </div>
  );
}
