import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Skip for standard local dev or App URL in AI Studio
  if (
    hostname.includes('localhost') ||
    hostname.includes('.run.app') ||
    hostname.includes('vercel.app') ||
    hostname.includes('.web.app')
  ) {
    return NextResponse.next();
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (rootDomain && hostname.endsWith(`.${rootDomain}`)) {
    return NextResponse.next(); // Handled normally or subdomains handle it
  }

  // Handle Custom Domains
  // We queries Supabase to find a page matching the custom_domain
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Find page with the given custom domain
    const { data: pageMatch } = await supabase
      .from('pages')
      .select('slug, users(username)')
      .eq('content->>customDomain', hostname)
      .single() as { data: any, error: any };

    if (pageMatch && pageMatch.users && (pageMatch.users.username || (Array.isArray(pageMatch.users) && pageMatch.users[0]?.username))) {
      const username = Array.isArray(pageMatch.users) ? pageMatch.users[0].username : pageMatch.users.username;
      const slug = pageMatch.slug;
      // Rewrite to /[username]/[slug] -> The user's page handles paths nicely
      return NextResponse.rewrite(new URL(`/${username}/${slug}${url.pathname}`, req.url));
    }
  }

  // If no match, continue
  return NextResponse.next();
}

