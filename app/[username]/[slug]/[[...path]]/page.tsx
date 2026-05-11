'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PageElement, AppVariable } from '@/lib/builder-store';
import Renderer from '@/components/Renderer';

export default function PublicSlugPage() {
  const { username, slug, path } = useParams();
  const [elements, setElements] = useState<PageElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [variables, setVariables] = useState<AppVariable[]>([]);

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

        const currentSlug = Array.isArray(slug) ? slug[0] : (slug || '');
        const decodedSlug = decodeURIComponent(currentSlug);
        
        const slugVariations = Array.from(new Set([
          currentSlug,
          decodedSlug,
          decodedSlug.trim(),
          decodedSlug.toLowerCase(),
          decodedSlug.toLowerCase().replace(/\s+/g, '-').replace(/(^-|-$)+/g, ''),
          currentSlug.toLowerCase(),
        ])).filter(Boolean);

        const { data: pageSnap, error: pageError } = await supabase
          .from('pages')
          .select('content')
          .eq('user_id', fetchedUserId)
          .in('slug', slugVariations)
          .limit(1);
        
        if (pageError || !pageSnap || pageSnap.length === 0) {
          setError(`Page not found: ${decodedSlug}`);
          setLoading(false);
          return;
        }

        const pageData = pageSnap[0];
        const content = typeof pageData.content === 'string' ? JSON.parse(pageData.content) : pageData.content;
        
        let targetElements: PageElement[] = [];

        if (content.sitePages && content.sitePages.length > 0) {
          const pathSegments = Array.isArray(path) ? path : (path ? [path] : []);
          const actualPath = '/' + pathSegments.map(p => typeof p === 'string' ? decodeURIComponent(p) : p).join('/');
          
          let page = content.sitePages.find((p: any) => p.path === actualPath);
          
          if (!page && pathSegments.length === 0) {
            page = content.sitePages.find((p: any) => p.path === '/');
          }
          if (!page && content.sitePages.length > 0) {
            page = content.sitePages.find((p: any) => p.path === '/' || p.path === '/home') || content.sitePages[0];
          }
          
          if (!page) {
            setError(`Page not found: ${actualPath}`);
            setLoading(false);
            return;
          }
          
          targetElements = page.elements || [];
        } else {
          targetElements = content.elements || [];
        }

        setElements(targetElements);
        setVariables(content.variables || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (username && slug) {
      fetchPage();
    }
  }, [username, slug, path]);

  if (!mounted) return <div className="min-h-screen flex items-center justify-center"></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !userId) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'User ID missing'}</div>;

  const renderedUsername = Array.isArray(username) ? username[0] : (username || '');
  const renderedSlug = Array.isArray(slug) ? slug[0] : (slug || '');

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="w-full max-w-4xl mx-auto min-h-screen relative">
        <Renderer 
           elements={elements}
           variables={variables}
           setVariable={setVariable}
           userId={userId}
           username={renderedUsername}
           slug={renderedSlug}
           isBuilderMode={false}
        />
      </div>
    </div>
  );
}
