import React, { useState, useEffect } from 'react';
import { PageElement, AppVariable } from '@/lib/builder-store';
import { executeWorkflow } from '@/lib/workflow-engine';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Star } from 'lucide-react';

interface RendererProps {
  elements: PageElement[];
  variables?: AppVariable[];
  setVariable?: (id: string, value: any) => void;
  userId?: string | null;
  slug?: string;
  username?: string;
  isBuilderMode?: boolean;
}

export default function Renderer({ 
  elements, 
  variables = [], 
  setVariable = () => {}, 
  userId, 
  slug, 
  username,
  isBuilderMode = false 
}: RendererProps) {
  // State for components that need DB
  const [dataSources, setDataSources] = useState<Record<string, any[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Fetch external data for any lists/tables
    const fetchAllData = async () => {
      if (!userId) return;
      const sources: Record<string, any[]> = {};
      
      for (const el of elements) {
        if (el.dataSource?.tableId && (el.type === 'list' || el.type === 'table')) {
          try {
            const q = query(
              collection(db, 'records'),
              where('tableId', '==', el.dataSource.tableId),
              where('userId', '==', userId)
              // We can add limits & sorts if they exist in el.dataSource
            );
            const snap = await getDocs(q);
            sources[el.id] = snap.docs.map(d => JSON.parse(d.data().data));
          } catch(e) {
            console.error('Data fetch error for element', el.id, e);
          }
        }
      }
      setDataSources(sources);
    };
    if (!isBuilderMode) {
      fetchAllData();
    }
  }, [elements, userId, isBuilderMode]);

  const triggeredRefs = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    // Execute onLoad events for any components that have them
    if (isBuilderMode) return;
    elements.forEach(el => {
      if (!triggeredRefs.current.has(el.id)) {
        const hasOnLoad = el.events?.find(e => e.trigger === 'onLoad');
        if (hasOnLoad) {
          triggeredRefs.current.add(el.id);
          executeElementEvents(el, 'onLoad');
        }
      }
    });
  }, [elements, isBuilderMode, variables, userId, slug, username]);

  const executeElementEvents = async (element: PageElement, trigger: string) => {
    if (isBuilderMode || !element.events) return;
    const ev = element.events.find(e => e.trigger === trigger);
    if (ev) {
      await executeWorkflow(ev.actions, { variables, setVariable, userId: userId || null, pageSlug: slug, username });
    }
  };

  const replaceVariablesInText = (text: string | undefined): string => {
    if (!text || typeof text !== 'string') return text || '';
    let result = text;
    variables.forEach(v => {
      const regex = new RegExp(`{{\\s*${v.name}\\s*}}`, 'g');
      result = result.replace(regex, v.defaultValue?.toString() || '');
    });
    return result;
  };

  const handleFormSubmit = async (e: React.FormEvent, element: PageElement) => {
    e.preventDefault();
    if (isBuilderMode) return;

    if (element.type === 'form' && element.dataSource?.tableId && userId) {
      setIsSubmitting(true);
      setFormSuccess(prev => ({ ...prev, [element.id]: false }));
      const formData = new FormData(e.target as HTMLFormElement);
      const data: Record<string, any> = {};
      formData.forEach((value, key) => data[key] = value);

      try {
        await addDoc(collection(db, 'records'), {
          tableId: element.dataSource.tableId,
          userId,
          data: JSON.stringify(data),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setFormSuccess(prev => ({ ...prev, [element.id]: true }));
        (e.target as HTMLFormElement).reset();
        await executeElementEvents(element, 'onSubmit');
      } catch (error) {
        console.error("Error submitting form", error);
      }
      setIsSubmitting(false);
    } else if (element.type === 'auth_form' && element.content.mode === 'signup') {
       // Signup Logic Mock
       setIsSubmitting(true);
       setFormSuccess(prev => ({ ...prev, [element.id]: false }));
       const formData = new FormData(e.target as HTMLFormElement);
       try {
         await addDoc(collection(db, 'site_users'), {
           ownerId: userId,
           email: formData.get('Email') as string,
           password: formData.get('Password') as string,
           role: 'user',
           createdAt: serverTimestamp(),
         });
         setFormSuccess(prev => ({ ...prev, [element.id]: true }));
         (e.target as HTMLFormElement).reset();
         await executeElementEvents(element, 'onSubmit');
       } catch(e) {
         console.error(e);
       }
       setIsSubmitting(false);
    } else if (element.type === 'auth_form' && element.content.mode === 'login') {
       setIsSubmitting(true);
       setFormSuccess(prev => ({ ...prev, [element.id]: false }));
       const formData = new FormData(e.target as HTMLFormElement);
       try {
         const q = query(
           collection(db, 'site_users'),
           where('ownerId', '==', userId),
           where('email', '==', formData.get('Email')),
           where('password', '==', formData.get('Password')),
           limit(1)
         );
         const snap = await getDocs(q);
         if (!snap.empty) {
           setFormSuccess(prev => ({ ...prev, [element.id]: true }));
           await executeElementEvents(element, 'onSubmit');
         } else {
           alert('Invalid credentials');
         }
       } catch(e) { console.error(e); }
       setIsSubmitting(false);
    }
  };

  const renderContent = (element: PageElement) => {
    const elStyle = element.style || {};
    const customClass = element.customCss || '';
    
    // Support running "onLoad" triggers immediately on map if not in builder mode
    // Though it belongs in Effect, for declarative builder simple triggers can be invoked at hydration wrapper

    switch (element.type) {
      case 'text': return <p id={element.customId} style={elStyle} className={customClass}>{replaceVariablesInText(element.content)}</p>;
      case 'heading': return <h2 id={element.customId} style={{ ...elStyle, fontWeight: 'bold' }} className={customClass}>{replaceVariablesInText(element.content)}</h2>;
      case 'image':
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img id={element.customId} src={element.content} alt="" style={elStyle} className={`object-cover ${customClass}`} draggable={false} />
        );
      case 'video':
        return (
          <div id={element.customId} style={{...elStyle, pointerEvents: isBuilderMode ? 'none' : 'auto'}} className={customClass}>
            <iframe width="100%" height="100%" src={element.content} frameBorder="0" allowFullScreen></iframe>
          </div>
        );
      case 'button':
        return <button id={element.customId} className={customClass} style={{...elStyle, pointerEvents: isBuilderMode ? 'none' : 'auto'}} onClick={() => executeElementEvents(element, 'onClick')}>{replaceVariablesInText(element.content)}</button>;
      case 'divider': return <div id={element.customId} style={elStyle} className={customClass} />;
      case 'card': return <div id={element.customId} style={{ ...elStyle, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} className={customClass}>{replaceVariablesInText(element.content)}</div>;
      case 'icon': return <Star id={element.customId} style={elStyle} className={customClass} />;
      case 'spacer': return <div id={element.customId} style={elStyle} className={customClass} />;
      case 'list':
        const listData = dataSources[element.id] && dataSources[element.id].length > 0 ? dataSources[element.id].map(r => Object.values(r).join(' - ')) : element.content;
        return (
          <ul id={element.customId} style={{ ...elStyle, listStyleType: 'disc', paddingLeft: '20px', pointerEvents: isBuilderMode ? 'none' : 'auto' }} className={customClass}>
            {(Array.isArray(listData) ? listData : []).map((item: any, i: number) => <li key={i}>{replaceVariablesInText(String(item))}</li>)}
          </ul>
        );
      case 'quote': return <blockquote id={element.customId} style={elStyle} className={customClass}>{replaceVariablesInText(element.content)}</blockquote>;
      case 'badge': return <span id={element.customId} style={elStyle} className={customClass}>{replaceVariablesInText(element.content)}</span>;
      case 'map':
        return <div id={element.customId} style={{...elStyle, pointerEvents: isBuilderMode ? 'none' : 'auto'}} className={customClass}><iframe width="100%" height="100%" src={element.content} frameBorder="0" allowFullScreen loading="lazy"></iframe></div>;
      case 'audio':
        return <div id={element.customId} style={{...elStyle, pointerEvents: isBuilderMode ? 'none' : 'auto'}} className={customClass}><audio controls src={element.content} style={{ width: '100%' }}></audio></div>;
      case 'alert': return <div id={element.customId} style={elStyle} className={customClass}>{replaceVariablesInText(element.content)}</div>;
      case 'accordion':
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {(element.content as any[]).map((item, i) => (
              <details key={i} style={{ borderBottom: '1px solid #eee', padding: '10px' }} open={isBuilderMode}>
                <summary style={{ fontWeight: 'bold', cursor: 'pointer', pointerEvents: isBuilderMode ? 'none' : 'auto' }}>{replaceVariablesInText(item.title)}</summary>
                <div style={{ marginTop: '10px' }}>{replaceVariablesInText(item.content)}</div>
              </details>
            ))}
          </div>
        );
      case 'pricing':
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{replaceVariablesInText(element.content?.plan || '')}</h3>
            <div style={{ fontSize: '32px', margin: '10px 0' }}>{replaceVariablesInText(element.content?.price || '')}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0' }}>
              {(element.content?.features || []).map((f: string, i: number) => <li key={i} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>{replaceVariablesInText(f)}</li>)}
            </ul>
            <button disabled={isBuilderMode} style={{ width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', pointerEvents: isBuilderMode ? 'none' : 'auto' }} onClick={() => executeElementEvents(element, 'onClick')}>
              Choose Plan
            </button>
          </div>
        );
      case 'gallery':
        return (
          <div id={element.customId} style={{ ...elStyle, gap: '10px', flexWrap: 'wrap' }} className={customClass}>
            {(Array.isArray(element.content) ? element.content : []).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img} alt="" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} loading="lazy" />
            ))}
          </div>
        );
      case 'form':
      case 'auth_form':
        return (
          <form id={element.customId} style={elStyle} className={customClass} onSubmit={(e) => handleFormSubmit(e, element)}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>{replaceVariablesInText(element.content?.title || '')}</h3>
            {formSuccess[element.id] && (
              <div style={{ color: 'green', padding: '10px', backgroundColor: '#e6fffa', border: '1px solid #38b259', borderRadius: '4px', marginBottom: '15px' }}>Action successful!</div>
            )}
            {element.type === 'form' && (
              <>
                <input type="text" name="Name" placeholder="Name" required disabled={isBuilderMode} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', pointerEvents: isBuilderMode ? 'none' : 'auto' }} />
                <input type="email" name="Email" placeholder="Email" required disabled={isBuilderMode} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', pointerEvents: isBuilderMode ? 'none' : 'auto' }} />
              </>
            )}
            {element.type === 'auth_form' && (
              <>
                <input type="email" name="Email" placeholder="Email" required disabled={isBuilderMode} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', pointerEvents: isBuilderMode ? 'none' : 'auto' }} />
                <input type="password" name="Password" placeholder="Password" required disabled={isBuilderMode} style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', pointerEvents: isBuilderMode ? 'none' : 'auto' }} />
              </>
            )}
            <button type="submit" disabled={isSubmitting || isBuilderMode} style={{ width: '100%', padding: '10px', backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6', color: 'white', borderRadius: '4px', pointerEvents: isBuilderMode ? 'none' : 'auto' }}>
              {isSubmitting ? '...' : replaceVariablesInText(element.content?.buttonText || 'Submit')}
            </button>
          </form>
        );
      case 'table':
        return (
          <table id={element.customId} style={{ ...elStyle, borderCollapse: 'collapse' }} className={customClass}>
            <thead><tr>{(element.content?.headers || []).map((h: string, i: number) => <th key={i} style={{ border: '1px solid #eee', padding: '8px', backgroundColor: '#f9fafb' }}>{replaceVariablesInText(h)}</th>)}</tr></thead>
            <tbody>
              {(dataSources[element.id] ? dataSources[element.id].map(r => Object.values(r)) : (element.content?.rows || [])).map((row: any[], i: number) => (
                <tr key={i}>{row.map((cell, j) => <td key={j} style={{ border: '1px solid #eee', padding: '8px' }}>{replaceVariablesInText(String(cell))}</td>)}</tr>
              ))}
            </tbody>
          </table>
        );
      case 'code': return <div id={element.customId} style={elStyle} className={customClass} dangerouslySetInnerHTML={{ __html: element.content }} />;
      case 'loading_screen':
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {element.content?.showSpinner && (
              <div className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 w-16 h-16 mb-4"></div>
            )}
            <h1 className="text-2xl font-bold text-gray-800">{replaceVariablesInText(element.content?.message || 'Loading...')}</h1>
          </div>
        );
      default:
        // Basic fallback for simple text/html replacements not explicitly covered above
        if (element.content && typeof element.content === 'object' && 'text' in element.content) {
            return <div id={element.customId} style={elStyle} className={customClass}>{replaceVariablesInText(element.content.text)}</div>;
        }
        if (typeof element.content === 'string') {
           return <div id={element.customId} style={elStyle} className={customClass}>{replaceVariablesInText(element.content)}</div>;
        }
        return <div id={element.customId} style={elStyle} className={customClass}>[Plugin: {element.type}]</div>;
    }
  };

  return (
    <>
      {elements.map((el) => {
         const content = renderContent(el);
         if (isBuilderMode) {
            return <React.Fragment key={el.id}>{content}</React.Fragment>;
         }
         return (
           <div
             key={el.id}
             style={{
               position: 'absolute',
               left: el.position.x,
               top: el.position.y,
             }}
             className="element-container"
           >
             {content}
           </div>
         );
      })}
    </>
  );
}
