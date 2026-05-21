'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PageElement, AppVariable } from '@/lib/builder-store';
import Renderer from '@/components/Renderer';

export default function PublicPage() {
  const { username } = useParams();
  const [elements, setElements] = useState<PageElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [variables, setVariables] = useState<AppVariable[]>([]);
  const [pageTitle, setPageTitle] = useState<string>('');
  const [pageDescription, setPageDescription] = useState<string>('');
  const [canonicalUrl, setCanonicalUrl] = useState<string>('');

  const setVariable = (id: string, value: any) => {
    setVariables(prev => {
      const idx = prev.findIndex(v => v.id === id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], defaultValue: value };
        return next;
      }
      return [...prev, { id, name: id, type: 'string', defaultValue: value }];
    });
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUsername = Array.isArray(username) ? username[0] : (username || '');
      setCanonicalUrl(`${window.location.origin}/${encodeURIComponent(currentUsername)}`);
    }
  }, [username]);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const currentUsername = Array.isArray(username) ? username[0] : (username || '');
        const decodedUsername = decodeURIComponent(currentUsername);
        
        const usernameVariations = Array.from(new Set([
          currentUsername,
          decodedUsername,
          decodedUsername.trim(),
          decodedUsername.toLowerCase(),
          decodedUsername.toLowerCase().trim(),
          currentUsername.toLowerCase(),
        ])).filter(Boolean);

        const { data: userSnap, error: userError } = await supabase
          .from('users')
          .select('id')
          .in('username', usernameVariations)
          .limit(1);
        
        if (userError || !userSnap || userSnap.length === 0) {
          setError(`User not found: ${decodedUsername}`);
          setLoading(false);
          return;
        }
        
        const fetchedUserId = userSnap[0].id;
        setUserId(fetchedUserId);

        let { data: pageSnap, error: pageError } = await supabase
          .from('pages')
          .select('content, title, description')
          .eq('user_id', fetchedUserId)
          .eq('slug', 'home')
          .limit(1);
        
        if (pageError || !pageSnap || pageSnap.length === 0) {
          // Fallback to any page
          const fallbackQuery = await supabase
            .from('pages')
            .select('content, title, description')
            .eq('user_id', fetchedUserId)
            .limit(1);
          pageSnap = fallbackQuery.data;
          pageError = fallbackQuery.error;
        }

        if (pageError || !pageSnap || pageSnap.length === 0) {
          setError('No page published yet');
          setLoading(false);
          return;
        }

        const pageData = pageSnap[0];
        setPageTitle(pageData.title || '');
        setPageDescription(pageData.description || '');
        const content = JSON.parse(pageData.content);
        setElements(content.elements || []);
        setVariables(content.variables || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchPage();
    }
  }, [username]);

  if (!mounted) return <div className="min-h-screen flex items-center justify-center"></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !userId) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'User ID missing'}</div>;

  const renderedUsername = Array.isArray(username) ? username[0] : (username || '');
  const decodedUsername = decodeURIComponent(renderedUsername);
  const displayTitle = pageTitle || `${decodedUsername} - Portfolio`;
  const displayDescription = pageDescription || `${decodedUsername}'s custom page built with Joex`;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <title>{displayTitle}</title>
      <meta name="description" content={displayDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={displayDescription} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={displayTitle} />
      <meta name="twitter:description" content={displayDescription} />

      <div className="w-full max-w-4xl mx-auto min-h-screen relative">
        <Renderer 
           elements={elements}
           variables={variables}
           setVariable={setVariable}
           userId={userId}
           username={renderedUsername}
           isBuilderMode={false}
        />
      </div>
    </div>
  );
}
