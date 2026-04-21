'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { PageElement, AppVariable } from '@/lib/builder-store';
import Renderer from '@/components/Renderer';

export default function PublicPage() {
  const { username } = useParams();
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
        const usersRef = collection(db, 'users');
        const qUser = query(usersRef, where('username', '==', username), limit(1));
        const userSnap = await getDocs(qUser);
        
        if (userSnap.empty) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        const fetchedUserId = userSnap.docs[0].id;
        setUserId(fetchedUserId);

        const pagesRef = collection(db, 'pages');
        const qPage = query(pagesRef, where('userId', '==', fetchedUserId), limit(1));
        const pageSnap = await getDocs(qPage);

        if (pageSnap.empty) {
          setError('No page published yet');
          setLoading(false);
          return;
        }

        const pageData = pageSnap.docs[0].data();
        const content = JSON.parse(pageData.content);
        setElements(content.elements || []);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error || !userId) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'User ID missing'}</div>;

  const renderedUsername = Array.isArray(username) ? username[0] : (username || '');

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
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
