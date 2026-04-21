'use client';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { PageElement } from '@/lib/builder-store';
import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PublicPage() {
  const { username } = useParams();
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

        // 2. Find first page by this user
        const pagesRef = collection(db, 'pages');
        const qPage = query(pagesRef, where('userId', '==', userId), limit(1));
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
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={element.content} alt="User added" style={element.style} className="object-cover" />
        );
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
      case 'accordion':
        return (
          <div style={element.style}>
            {(element.content as any[]).map((item, i) => (
              <details key={i} style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>{item.title}</summary>
                <div style={{ marginTop: '10px' }}>{item.content}</div>
              </details>
            ))}
          </div>
        );
      case 'pricing':
        return (
          <div style={element.style}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{element.content.plan}</h3>
            <div style={{ fontSize: '32px', margin: '10px 0' }}>{element.content.price}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0' }}>
              {(element.content.features as string[]).map((f, i) => (
                <li key={i} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>{f}</li>
              ))}
            </ul>
            <button style={{ width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px' }}>Choose Plan</button>
          </div>
        );
      case 'testimonial':
        return (
          <div style={element.style}>
            <p style={{ marginBottom: '10px' }}>&quot;{element.content.quote}&quot;</p>
            <div style={{ fontWeight: 'bold' }}>{element.content.author}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{element.content.role}</div>
          </div>
        );
      case 'gallery':
        return (
          <div style={{ ...element.style, gap: '10px', flexWrap: 'wrap' }}>
            {(element.content as string[]).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img} alt={`Gallery ${i}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} loading="lazy" />
            ))}
          </div>
        );
      case 'countdown':
        return <div style={element.style}>{element.content}</div>;
      case 'progress':
        return (
          <div style={element.style}>
            <div style={{ width: `${element.content}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '9999px' }}></div>
          </div>
        );
      case 'social':
        return (
          <div style={{ ...element.style, gap: '16px' }}>
            {(element.content as string[]).map((network, i) => (
              <a key={i} href="#" style={{ textTransform: 'capitalize', textDecoration: 'none', color: 'inherit' }}>{network}</a>
            ))}
          </div>
        );
      case 'form':
        return (
          <form style={element.style} onSubmit={(e) => e.preventDefault()}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>{element.content.title}</h3>
            <input type="text" placeholder="Name" style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="email" placeholder="Email" style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px' }}>{element.content.buttonText}</button>
          </form>
        );
      case 'table':
        return (
          <table style={{ ...element.style, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {(element.content.headers as string[]).map((h, i) => (
                  <th key={i} style={{ border: '1px solid #eee', padding: '8px', backgroundColor: '#f9fafb', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(element.content.rows as string[][]).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ border: '1px solid #eee', padding: '8px' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'code':
        return <div style={element.style} dangerouslySetInnerHTML={{ __html: element.content }} />;
      case 'avatar':
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={element.content} alt="Avatar" style={element.style} draggable={false} />
        );
      case 'hero':
        return (
          <div style={element.style}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>{element.content.title}</h1>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>{element.content.subtitle}</p>
            <button style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px' }}>{element.content.buttonText}</button>
          </div>
        );
      case 'stat':
        return (
          <div style={element.style}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{element.content.value}</div>
            <div style={{ color: '#6b7280' }}>{element.content.label}</div>
          </div>
        );
      case 'steps':
        return (
          <div style={element.style}>
            {(element.content as any[]).map((s, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <strong>{i + 1}. {s.title}</strong>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{s.description}</p>
              </div>
            ))}
          </div>
        );
      case 'rating':
        return (
          <div style={element.style}>
            {'★'.repeat(Number(element.content))}{'☆'.repeat(5 - Number(element.content))}
          </div>
        );
      case 'newsletter':
        return (
          <div style={element.style}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>{element.content.title}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="email" placeholder={element.content.placeholder} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <button style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px' }}>{element.content.buttonText}</button>
            </div>
          </div>
        );
      case 'marquee':
        return (
          <div style={{ ...element.style, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ display: 'inline-block', animation: 'marquee 10s linear infinite' }}>{element.content}</div>
          </div>
        );
      case 'profile':
        return (
          <div style={element.style}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={element.content.avatarUrl} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px', objectFit: 'cover' }} draggable={false} />
            <h3 style={{ fontWeight: 'bold', margin: 0 }}>{element.content.name}</h3>
            <div style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '10px' }}>{element.content.role}</div>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{element.content.bio}</p>
          </div>
        );
      case 'iframe':
        return (
          <div style={element.style}>
            <iframe src={element.content} style={{ width: '100%', height: '100%', border: 'none' }} title="Iframe" allowFullScreen></iframe>
          </div>
        );
      case 'breadcrumbs':
        return (
          <div style={element.style}>
            {(element.content as string[]).join(' / ')}
          </div>
        );
      case 'tags':
        return (
          <div style={element.style}>
            {(element.content as string[]).map((t, i) => (
              <span key={i} style={{ padding: '4px 12px', backgroundColor: '#e5e7eb', borderRadius: '999px', fontSize: '12px' }}>{t}</span>
            ))}
          </div>
        );
      case 'search':
        return <input type="text" placeholder={element.content} style={element.style} />;
      case 'banner':
        return (
          <div style={element.style}>
            {element.content.text} <a href={element.content.link} style={{ textDecoration: 'underline', marginLeft: '10px' }}>Learn more</a>
          </div>
        );
      case 'footer':
        return (
          <div style={element.style}>
            <div style={{ marginBottom: '10px' }}>{element.content.copyright}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              {(element.content.links as string[]).map((l, i) => <a key={i} href="#" style={{ color: 'inherit' }}>{l}</a>)}
            </div>
          </div>
        );
      case 'logo':
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={element.content.url} alt={element.content.alt} style={element.style} draggable={false} />
        );
      case 'callout':
        return (
          <div style={element.style}>
            <span style={{ fontSize: '24px' }}>{element.content.emoji}</span>
            <div>{element.content.text}</div>
          </div>
        );
      case 'checklist':
        return (
          <div style={element.style}>
            {(element.content as any[]).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <input type="checkbox" checked={c.checked} readOnly />
                <span style={{ textDecoration: c.checked ? 'line-through' : 'none', color: c.checked ? '#9ca3af' : 'inherit' }}>{c.text}</span>
              </div>
            ))}
          </div>
        );
      case 'spinner':
        return <div style={element.style}>{element.content}</div>;
      case 'toggle':
        return (
          <div style={element.style}>
            <input type="checkbox" checked={element.content.checked} readOnly style={{ width: '20px', height: '20px' }} />
            <span>{element.content.label}</span>
          </div>
        );
      case 'signature':
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
