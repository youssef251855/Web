'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { PageElement } from '@/lib/builder-store';
import { Star } from 'lucide-react';

export default function PublicSlugPage() {
  const { username, slug } = useParams();
  const [elements, setElements] = useState<PageElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        // 1. Find user by username
        const usersRef = collection(db, 'users');
        const qUser = query(usersRef, where('username', '==', username), limit(1));
        const userSnap = await getDocs(qUser);
        
        if (userSnap.empty) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        const userId = userSnap.docs[0].id;

        // 2. Find page by slug and userId
        const pagesRef = collection(db, 'pages');
        const qPage = query(pagesRef, where('userId', '==', userId), where('slug', '==', slug), limit(1));
        const pageSnap = await getDocs(qPage);

        if (pageSnap.empty) {
          setError('Page not found');
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

    if (username && slug) {
      fetchPage();
    }
  }, [username, slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="w-full max-w-4xl mx-auto min-h-screen relative">
        {elements.map((el) => (
          <RenderElement key={el.id} element={el} username={username} />
        ))}
      </div>
    </div>
  );
}

function RenderElement({ element, username }: { element: PageElement, username: string | string[] | undefined }) {
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return <p style={element.style}>{element.content}</p>;
      case 'heading':
        return <h2 style={{ ...element.style, fontWeight: 'bold' }}>{element.content}</h2>;
      case 'image':
        return <img src={element.content} alt="User added" style={element.style} className="object-cover" />;
      case 'video':
        return (
          <div style={element.style}>
            <iframe width="100%" height="100%" src={element.content} title="Video" frameBorder="0" allowFullScreen></iframe>
          </div>
        );
      case 'button':
        const handleClick = () => {
          if (!element.action) return;
          if (element.action.type === 'url' && element.action.value) {
            window.open(element.action.value, '_blank');
          } else if (element.action.type === 'page' && element.action.value) {
            window.location.href = `/${username}/${element.action.value}`;
          }
        };
        return <button style={element.style} onClick={handleClick}>{element.content}</button>;
      case 'divider':
        return <div style={element.style} />;
      case 'card':
        return <div style={{ ...element.style, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>{element.content}</div>;
      case 'icon':
        return <Star style={element.style} />;
      case 'spacer':
        return <div style={element.style} />;
      case 'list':
        return (
          <ul style={{ ...element.style, listStyleType: 'disc', paddingLeft: '20px' }}>
            {(element.content as string[]).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        );
      case 'quote':
        return <blockquote style={element.style}>{element.content}</blockquote>;
      case 'badge':
        return <span style={element.style}>{element.content}</span>;
      case 'map':
        return (
          <div style={element.style}>
            <iframe width="100%" height="100%" src={element.content} title="Map" frameBorder="0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
        );
      case 'audio':
        return (
          <div style={element.style}>
            <audio controls src={element.content} style={{ width: '100%' }}></audio>
          </div>
        );
      case 'alert':
        return <div style={element.style}>{element.content}</div>;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
      }}
    >
      {renderContent()}
    </div>
  );
}
