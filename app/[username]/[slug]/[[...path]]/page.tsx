import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import PublicSlugPageClient from './page-client';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    username: string;
    slug: string;
    path?: string[];
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username ? decodeURIComponent(resolvedParams.username) : '';
  const slug = resolvedParams.slug ? decodeURIComponent(resolvedParams.slug) : '';
  
  const usernameVariations = Array.from(new Set([
    username,
    username.trim(),
    username.toLowerCase(),
    username.toLowerCase().trim(),
  ])).filter(Boolean);

  try {
    let fetchedUserId: string | null = null;

    const { data: userSnap } = await supabase
      .from('users')
      .select('id')
      .in('username', usernameVariations)
      .limit(1);

    if (userSnap && userSnap.length > 0) {
      fetchedUserId = userSnap[0].id;
    } else {
      const { data: nameSnap } = await supabase
        .from('users')
        .select('id')
        .in('name', usernameVariations)
        .limit(1);
      if (nameSnap && nameSnap.length > 0) {
        fetchedUserId = nameSnap[0].id;
      }
    }

    if (!fetchedUserId) {
      const { data: siteUserSnap } = await supabase
        .from('site_users')
        .select('id')
        .in('name', usernameVariations)
        .limit(1);
      if (siteUserSnap && siteUserSnap.length > 0) {
        fetchedUserId = siteUserSnap[0].id;
      }
    }

    if (!fetchedUserId) {
      const { data: anyPageSnap } = await supabase
        .from('pages')
        .select('user_id')
        .limit(1);
      if (anyPageSnap && anyPageSnap.length > 0 && anyPageSnap[0].user_id) {
        fetchedUserId = anyPageSnap[0].user_id;
      }
    }

    if (fetchedUserId) {
      const slugVariations = Array.from(new Set([
        slug,
        slug.trim(),
        slug.toLowerCase(),
        slug.toLowerCase().replace(/\s+/g, '-').replace(/(^-|-$)+/g, ''),
      ])).filter(Boolean);

      const { data: pageSnap } = await supabase
        .from('pages')
        .select('title, description')
        .eq('user_id', fetchedUserId)
        .in('slug', slugVariations)
        .limit(1);

      if (pageSnap && pageSnap.length > 0) {
        const pageData = pageSnap[0];
        const displayTitle = pageData.title ? `${pageData.title} | ${username}` : `${slug} - ${username}`;
        const displayDescription = pageData.description || `${slug} page on ${username}'s site built with Joex`;
        return {
          title: displayTitle,
          description: displayDescription,
          openGraph: {
            title: displayTitle,
            description: displayDescription,
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: displayTitle,
            description: displayDescription,
          }
        };
      }
    }
  } catch (e) {
    console.error('Error generating metadata', e);
  }

  const defaultTitle = `${slug} - ${username}`;
  const defaultDesc = `${slug} page on ${username}'s site built with Joex`;
  return {
    title: defaultTitle,
    description: defaultDesc,
    openGraph: {
      title: defaultTitle,
      description: defaultDesc,
    }
  };
}

export default async function PublicSlugPage() {
  return <PublicSlugPageClient />;
}
