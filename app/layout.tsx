import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'WebWeaver - Mini Website Builder',
  description: 'A drag-and-drop website builder allowing users to create and publish their own web pages.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && Object.prototype.toString.call(event.reason) === '[object Event]') {
                  event.preventDefault();
                }
              });
            `
          }}
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body suppressHydrationWarning>
        <div className="bg-amber-500 text-white text-center p-2 text-sm font-semibold sticky top-0 z-50">
          تنبيه: المنصة قد تتوقف عن العمل في أي وقت.
        </div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
