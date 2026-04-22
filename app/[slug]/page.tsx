'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { PageElement, AppVariable } from '@/lib/builder-store';
import Renderer from '@/components/Renderer';

export default function FlatPage() {
  const { slug } = useParams();
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

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const pagesRef = collection(db, 'pages');
        const qPage = query(pagesRef, where('slug', '==', slug), limit(1));
        const pageSnap = await getDocs(qPage);

        if (pageSnap.empty) {
          setError('Page not found');
          setLoading(false);
          return;
        }

        const pageData = pageSnap.docs[0].data();
        setUserId(pageData.userId);
        const content = JSON.parse(pageData.content);
        setElements(content.elements || []);
        
        // Update document title and meta description dynamically
        if (pageData.title) document.title = pageData.title;
        if (pageData.description) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', pageData.description);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !userId) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Page missing'}</div>;

  const renderedSlug = Array.isArray(slug) ? slug[0] : (slug || '');

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="w-full max-w-4xl mx-auto min-h-screen relative">
        <Renderer 
           elements={elements}
           variables={variables}
           setVariable={setVariable}
           userId={userId}
           slug={renderedSlug}
           isBuilderMode={false}
        />
      </div>
    </div>
  );
}
