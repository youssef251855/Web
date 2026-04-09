'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useBuilderStore, ElementType, PageElement } from '@/lib/builder-store';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Type, Heading, Image as ImageIcon, Video, Square, Minus, CreditCard, Star, AlignJustify, List, Plus, Layout, Settings, Quote, Map, Music, AlertCircle, Tag, Send, Copy, Check } from 'lucide-react';

const SIDEBAR_ITEMS: { type: ElementType; icon: any; label: string }[] = [
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'heading', icon: Heading, label: 'Heading' },
  { type: 'image', icon: ImageIcon, label: 'Image' },
  { type: 'video', icon: Video, label: 'Video' },
  { type: 'button', icon: Square, label: 'Button' },
  { type: 'divider', icon: Minus, label: 'Divider' },
  { type: 'card', icon: CreditCard, label: 'Card' },
  { type: 'icon', icon: Star, label: 'Icon' },
  { type: 'spacer', icon: AlignJustify, label: 'Spacer' },
  { type: 'list', icon: List, label: 'List' },
  { type: 'quote', icon: Quote, label: 'Quote' },
  { type: 'badge', icon: Tag, label: 'Badge' },
  { type: 'map', icon: Map, label: 'Map' },
  { type: 'audio', icon: Music, label: 'Audio' },
  { type: 'alert', icon: AlertCircle, label: 'Alert' },
];

export default function BuilderPage() {
  const { id } = useParams();
  const { user, username, loading } = useAuth();
  const router = useRouter();
  const { elements, setElements, addElement, updateElement, removeElement, selectedElementId, selectElement } = useBuilderStore();
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileView, setMobileView] = useState<'elements' | 'canvas' | 'properties'>('canvas');
  const [userPages, setUserPages] = useState<{id: string, title: string, slug: string}[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!user || !id) return;
      const docRef = doc(db, 'pages', id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        setPageTitle(docSnap.data().title);
        setPageSlug(docSnap.data().slug);
        const content = JSON.parse(docSnap.data().content);
        setElements(content.elements || []);
      } else {
        router.push('/dashboard');
      }
    };
    fetchPage();
  }, [id, user, router, setElements]);

  useEffect(() => {
    const fetchUserPages = async () => {
      if (!user) return;
      const q = query(collection(db, 'pages'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const pages = snap.docs.map(d => ({ id: d.id, title: d.data().title, slug: d.data().slug }));
      setUserPages(pages);
    };
    fetchUserPages();
  }, [user]);

  const handleSave = async () => {
    if (!user || !id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'pages', id as string), {
        content: JSON.stringify({ elements }),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving page", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    await handleSave();
    setShowPublishModal(true);
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/${username}/${pageSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-save effect
  useEffect(() => {
    if (!user || !id || elements.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000); // Auto save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [elements, user, id]);

  const handleAddElement = (type: ElementType) => {
    // Add to center of canvas roughly
    addElement(type, { x: 50, y: 50 });
    setMobileView('canvas');
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Topbar */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-md mr-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-800">{pageTitle}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open(`/${username}/${pageSlug}`, '_blank')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center text-sm hover:bg-gray-200 transition"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center text-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center text-sm hover:bg-green-700 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4 mr-2" /> Publish
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`${mobileView === 'elements' ? 'flex' : 'hidden'} md:flex absolute md:relative z-10 w-full md:w-64 h-full bg-white border-r flex-col shrink-0 overflow-y-auto`}>
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Elements</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.type}
                onClick={() => handleAddElement(item.type)}
                className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition bg-gray-50"
              >
                <item.icon className="w-6 h-6 text-gray-600 mb-2" />
                <span className="text-xs text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main 
          className={`${mobileView === 'canvas' ? 'flex' : 'hidden'} md:flex flex-1 relative overflow-auto bg-gray-200 p-4 md:p-8`}
          onClick={() => selectElement(null)}
        >
          <div 
            ref={canvasRef}
            className="w-full max-w-4xl mx-auto min-h-[800px] bg-white shadow-sm relative"
            style={{ width: '800px' }}
          >
            {elements.map((el) => (
              <BuilderElement key={el.id} element={el} canvasRef={canvasRef} onSelect={() => setMobileView('properties')} />
            ))}
          </div>
        </main>

        {/* Inspector */}
        <aside className={`${mobileView === 'properties' ? 'flex' : 'hidden'} md:flex absolute md:relative right-0 z-10 w-full md:w-80 h-full bg-white border-l flex-col shrink-0 overflow-y-auto`}>
          <div className="p-4 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Properties</h2>
          </div>
          {selectedElement ? (
            <div className="p-4 space-y-6">
              {/* Content Edit */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Content</label>
                {selectedElement.type === 'list' ? (
                  <textarea
                    value={(selectedElement.content as string[]).join('\n')}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value.split('\n') })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                    rows={4}
                  />
                ) : selectedElement.type === 'divider' || selectedElement.type === 'spacer' ? (
                  <p className="text-sm text-gray-500">No content to edit.</p>
                ) : (
                  <input
                    type="text"
                    value={selectedElement.content}
                    onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                )}
              </div>

              {/* Style Edit */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Style</h3>
                
                {selectedElement.style.color !== undefined && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={selectedElement.style.color}
                      onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })}
                      className="w-full h-8 cursor-pointer"
                    />
                  </div>
                )}
                
                {selectedElement.style.backgroundColor !== undefined && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={selectedElement.style.backgroundColor}
                      onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, backgroundColor: e.target.value } })}
                      className="w-full h-8 cursor-pointer"
                    />
                  </div>
                )}

                {selectedElement.style.fontSize !== undefined && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                    <input
                      type="text"
                      value={selectedElement.style.fontSize}
                      onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: e.target.value } })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                )}

                {selectedElement.style.width !== undefined && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width</label>
                    <input
                      type="text"
                      value={selectedElement.style.width}
                      onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, width: e.target.value } })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                )}

                {selectedElement.style.height !== undefined && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height</label>
                    <input
                      type="text"
                      value={selectedElement.style.height}
                      onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, height: e.target.value } })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Action Edit (for buttons) */}
              {selectedElement.type === 'button' && (
                <div className="space-y-4 mt-4 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900">Button Action</h3>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Action Type</label>
                    <select
                      value={selectedElement.action?.type || 'none'}
                      onChange={(e) => updateElement(selectedElement.id, { action: { type: e.target.value as any, value: '' } })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="none">None</option>
                      <option value="url">Open URL</option>
                      <option value="page">Go to Page</option>
                    </select>
                  </div>
                  {selectedElement.action?.type === 'url' && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">URL</label>
                      <input
                        type="url"
                        value={selectedElement.action.value}
                        onChange={(e) => updateElement(selectedElement.id, { action: { ...selectedElement.action!, value: e.target.value } })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="https://example.com"
                      />
                    </div>
                  )}
                  {selectedElement.action?.type === 'page' && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Select Page</label>
                      <select
                        value={selectedElement.action.value}
                        onChange={(e) => updateElement(selectedElement.id, { action: { ...selectedElement.action!, value: e.target.value } })}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="">-- Select a page --</option>
                        {userPages.map(p => (
                          <option key={p.id} value={p.slug}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t">
                <button
                  onClick={() => removeElement(selectedElement.id)}
                  className="w-full py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium transition"
                >
                  Delete Element
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              Select an element on the canvas to edit its properties.
            </div>
          )}
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden h-14 bg-white border-t flex items-center justify-around shrink-0">
        <button onClick={() => setMobileView('elements')} className={`flex flex-col items-center ${mobileView === 'elements' ? 'text-blue-600' : 'text-gray-500'}`}>
          <Plus className="w-5 h-5" />
          <span className="text-[10px] mt-1">Add</span>
        </button>
        <button onClick={() => setMobileView('canvas')} className={`flex flex-col items-center ${mobileView === 'canvas' ? 'text-blue-600' : 'text-gray-500'}`}>
          <Layout className="w-5 h-5" />
          <span className="text-[10px] mt-1">Canvas</span>
        </button>
        <button onClick={() => setMobileView('properties')} className={`flex flex-col items-center ${mobileView === 'properties' ? 'text-blue-600' : 'text-gray-500'}`}>
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1">Edit</span>
        </button>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-green-600 flex items-center">
                <Check className="w-5 h-5 mr-2" /> Page Published!
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Your page is now live and accessible to the public at the following URL:</p>
              <div className="flex items-center space-x-2 mb-6">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${username}/${pageSlug}`}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-700 outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  Close
                </button>
                <button
                  onClick={() => window.open(`/${username}/${pageSlug}`, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Visit Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BuilderElement({ element, canvasRef, onSelect }: { element: PageElement, canvasRef: React.RefObject<HTMLDivElement | null>, onSelect: () => void }) {
  const { selectElement, selectedElementId, updateElement } = useBuilderStore();
  const isSelected = selectedElementId === element.id;

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return <p style={element.style}>{element.content}</p>;
      case 'heading':
        return <h2 style={{ ...element.style, fontWeight: 'bold' }}>{element.content}</h2>;
      case 'image':
        return <img src={element.content} alt="User added" style={element.style} className="object-cover" draggable={false} />;
      case 'video':
        return (
          <div style={{ ...element.style, pointerEvents: 'none' }}>
            <iframe width="100%" height="100%" src={element.content} title="Video" frameBorder="0" allowFullScreen></iframe>
          </div>
        );
      case 'button':
        return <button style={element.style}>{element.content}</button>;
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
          <div style={{ ...element.style, pointerEvents: 'none' }}>
            <iframe width="100%" height="100%" src={element.content} title="Map" frameBorder="0" allowFullScreen></iframe>
          </div>
        );
      case 'audio':
        return (
          <div style={{ ...element.style, pointerEvents: 'none' }}>
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
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={canvasRef}
      onDragEnd={(e, info) => {
        updateElement(element.id, {
          position: {
            x: element.position.x + info.offset.x,
            y: element.position.y + info.offset.y,
          }
        });
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectElement(element.id);
        onSelect();
      }}
      style={{
        position: 'absolute',
        left: element.position.x,
        top: element.position.y,
        x: 0,
        y: 0,
      }}
      className={`cursor-move ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'}`}
    >
      {renderContent()}
    </motion.div>
  );
}
