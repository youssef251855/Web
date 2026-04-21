import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Get the root domain from environment variables
  // Example: "mywebsite.com" or "localhost:3000"
  let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  // If no root domain is configured, proceed with normal path-based routing
  if (!rootDomain) {
    return NextResponse.next();
  }

  // Remove potential http/https prefixes from rootDomain
  rootDomain = rootDomain.replace(/^https?:\/\//, '');

  // Extract the subdomain
  // Example: "john.mywebsite.com" -> "john"
  const currentHost = hostname.replace(`.${rootDomain}`, '');

  // If there is no subdomain, or it's the root domain, or 'www', proceed normally
  if (currentHost === hostname || currentHost === rootDomain || currentHost === 'www') {
    return NextResponse.next();
  }

  // Rewrite the request to the dynamic route /[username]/[path]
  // Example: john.mywebsite.com/about -> /john/about
  // Example: john.mywebsite.com/ -> /john
  return NextResponse.rewrite(new URL(`/${currentHost}${url.pathname}`, req.url));
}
