import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Joex - Build the web',
  description: 'A drag-and-drop website builder allowing users to create and publish their own web pages.',
  appleWebApp: {
    capable: true,
    title: 'Joex',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
