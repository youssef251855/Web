import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'joex',
  description: 'A drag-and-drop website builder allowing users to create and publish their own web pages.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'joex',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'joex',
    description: 'A drag-and-drop website builder allowing users to create and publish their own web pages.',
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
      <body className="bg-black text-white antialiased selection:bg-blue-500/30" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
