'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useBuilderStore, ElementType, PageElement } from '@/lib/builder-store';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Type, Heading, Image as ImageIcon, Video, Square, Minus, CreditCard, Star, AlignJustify, List, Plus, Layout, Settings, Quote, Map, Music, AlertCircle, Tag, Send, Copy, Check, ChevronDown, DollarSign, MessageSquare, Clock, BatteryMedium, Share2, FormInput, Table as TableIcon, Code, User, LayoutTemplate, BarChart, ListOrdered, StarHalf, Mail, UserSquare, AppWindow, ChevronRight, Tags, Search, Flag, PanelBottom, Lightbulb, CheckSquare, Loader, ToggleRight, PenTool, UserPlus } from 'lucide-react';
import CloudinaryUploadWidget from '@/components/CloudinaryUploadWidget';

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
  { type: 'accordion', icon: ChevronDown, label: 'Accordion' },
  { type: 'pricing', icon: DollarSign, label: 'Pricing' },
  { type: 'testimonial', icon: MessageSquare, label: 'Testimonial' },
  { type: 'gallery', icon: ImageIcon, label: 'Gallery' },
  { type: 'countdown', icon: Clock, label: 'Countdown' },
  { type: 'progress', icon: BatteryMedium, label: 'Progress' },
  { type: 'social', icon: Share2, label: 'Social' },
  { type: 'form', icon: FormInput, label: 'Form' },
  { type: 'table', icon: TableIcon, label: 'Table' },
  { type: 'code', icon: Code, label: 'HTML Code' },
  { type: 'avatar', icon: User, label: 'Avatar' },
  { type: 'hero', icon: LayoutTemplate, label: 'Hero' },
  { type: 'stat', icon: BarChart, label: 'Stat' },
  { type: 'steps', icon: ListOrdered, label: 'Steps' },
  { type: 'rating', icon: StarHalf, label: 'Rating' },
  { type: 'newsletter', icon: Mail, label: 'Newsletter' },
  { type: 'marquee', icon: Type, label: 'Marquee' },
  { type: 'profile', icon: UserSquare, label: 'Profile' },
  { type: 'iframe', icon: AppWindow, label: 'Iframe' },
  { type: 'breadcrumbs', icon: ChevronRight, label: 'Breadcrumbs' },
  { type: 'tags', icon: Tags, label: 'Tags' },
  { type: 'search', icon: Search, label: 'Search' },
  { type: 'banner', icon: Flag, label: 'Banner' },
  { type: 'footer', icon: PanelBottom, label: 'Footer' },
  { type: 'logo', icon: ImageIcon, label: 'Logo' },
  { type: 'callout', icon: Lightbulb, label: 'Callout' },
  { type: 'checklist', icon: CheckSquare, label: 'Checklist' },
  { type: 'spinner', icon: Loader, label: 'Spinner' },
  { type: 'toggle', icon: ToggleRight, label: 'Toggle' },
  { type: 'signature', icon: PenTool, label: 'Signature' },
  { type: 'auth_form', icon: UserPlus, label: 'Sign Up / Login' },
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
  const [userTables, setUserTables] = useState<{id: string, name: string, fields: any[]}[]>([]);
  const [userSettings, setUserSettings] = useState<{cloudinaryCloudName?: string, cloudinaryUploadPreset?: string} | null>(null);
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
    const fetchUserPagesAndTables = async () => {
      if (!user) return;
      
      const qPages = query(collection(db, 'pages'), where('userId', '==', user.uid));
      const snapPages = await getDocs(qPages);
      const pages = snapPages.docs.map(d => ({ id: d.id, title: d.data().title, slug: d.data().slug }));
      setUserPages(pages);

      const qTables = query(collection(db, 'tables'), where('userId', '==', user.uid));
      const snapTables = await getDocs(qTables);
      const tables = snapTables.docs.map(d => ({ 
        id: d.id, 
        name: d.data().name,
        fields: JSON.parse(d.data().fields || '[]')
      }));
      setUserTables(tables);

      const settingsSnap = await getDoc(doc(db, 'user_settings', user.uid));
      if (settingsSnap.exists()) {
        setUserSettings(settingsSnap.data());
      }
    };
    fetchUserPagesAndTables();
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

  const getPublicUrl = () => {
    let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (rootDomain) {
      rootDomain = rootDomain.replace(/^https?:\/\//, '');
      
      // Vercel and Cloud Run default domains do not support wildcard subdomains without custom domain setup
      if (rootDomain.endsWith('.vercel.app') || rootDomain.endsWith('.run.app')) {
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/${username}/${pageSlug}`;
      }
      
      const protocol = rootDomain.includes('localhost') ? 'http' : 'https';
      return `${protocol}://${username}.${rootDomain}/${pageSlug}`;
    }
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/${username}/${pageSlug}`;
  };

  const handlePublish = async () => {
    await handleSave();
    setShowPublishModal(true);
  };

  const copyToClipboard = () => {
    const url = getPublicUrl();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, user, id]);

  const handleAddElement = (type: ElementType) => {
    // Add to center of canvas roughly
    addElement(type, { x: 50, y: 50 });
    setMobileView('canvas');
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  const renderContentEditor = () => {
    if (!selectedElement) return null;
    
    switch (selectedElement.type) {
      case 'divider':
      case 'spacer':
        return <p className="text-sm text-gray-500">No content to edit.</p>;

      case 'list':
      case 'gallery':
      case 'social':
      case 'breadcrumbs':
      case 'tags':
        return (
          <textarea
            value={(selectedElement.content as string[]).join('\n')}
            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value.split('\n') })}
            className="w-full px-3 py-2 border rounded-md text-sm"
            rows={4}
            placeholder="One item per line"
          />
        );

      case 'progress':
        return (
          <input
            type="number"
            min="0"
            max="100"
            value={selectedElement.content as number}
            onChange={(e) => updateElement(selectedElement.id, { content: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        );

      case 'testimonial':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).quote} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), quote: e.target.value } })} placeholder="Quote" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).author} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), author: e.target.value } })} placeholder="Author" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).role} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), role: e.target.value } })} placeholder="Role" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );

      case 'form':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).title} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), title: e.target.value } })} placeholder="Form Title" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).buttonText} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), buttonText: e.target.value } })} placeholder="Button Text" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).plan} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), plan: e.target.value } })} placeholder="Plan Name" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).price} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), price: e.target.value } })} placeholder="Price" className="w-full px-3 py-2 border rounded-md text-sm" />
            <label className="block text-xs text-gray-500 mt-2">Features (one per line)</label>
            <textarea value={((selectedElement.content as any).features as string[]).join('\n')} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), features: e.target.value.split('\n') } })} className="w-full px-3 py-2 border rounded-md text-sm" rows={4} />
          </div>
        );

      case 'accordion':
        return (
          <div className="space-y-4">
            {(selectedElement.content as any[]).map((item, index) => (
              <div key={index} className="space-y-2 border p-2 rounded-md relative">
                <button onClick={() => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent.splice(index, 1);
                  updateElement(selectedElement.id, { content: newContent });
                }} className="absolute top-1 right-1 text-red-500 text-xs">X</button>
                <input type="text" value={item.title} onChange={(e) => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent[index].title = e.target.value;
                  updateElement(selectedElement.id, { content: newContent });
                }} placeholder="Title" className="w-full px-2 py-1 border rounded-md text-sm" />
                <textarea value={item.content} onChange={(e) => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent[index].content = e.target.value;
                  updateElement(selectedElement.id, { content: newContent });
                }} placeholder="Content" className="w-full px-2 py-1 border rounded-md text-sm" rows={2} />
              </div>
            ))}
            <button onClick={() => updateElement(selectedElement.id, { content: [...(selectedElement.content as any[]), { title: 'New Item', content: 'New Content' }] })} className="w-full py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200">+ Add Item</button>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-2">
            <label className="block text-xs text-gray-500">Headers (comma separated)</label>
            <input type="text" value={((selectedElement.content as any).headers as string[]).join(',')} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), headers: e.target.value.split(',') } })} className="w-full px-3 py-2 border rounded-md text-sm" />
            <label className="block text-xs text-gray-500 mt-2">Rows (one row per line, comma separated columns)</label>
            <textarea value={((selectedElement.content as any).rows as string[][]).map(row => row.join(',')).join('\n')} onChange={(e) => {
              const rows = e.target.value.split('\n').map(row => row.split(','));
              updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), rows } });
            }} className="w-full px-3 py-2 border rounded-md text-sm" rows={4} />
          </div>
        );

      case 'hero':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).title} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), title: e.target.value } })} placeholder="Title" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).subtitle} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), subtitle: e.target.value } })} placeholder="Subtitle" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).buttonText} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), buttonText: e.target.value } })} placeholder="Button Text" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );
      case 'stat':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).value} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), value: e.target.value } })} placeholder="Value" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).label} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), label: e.target.value } })} placeholder="Label" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );
      case 'steps':
        return (
          <div className="space-y-4">
            {(selectedElement.content as any[]).map((item, index) => (
              <div key={index} className="space-y-2 border p-2 rounded-md relative">
                <button onClick={() => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent.splice(index, 1);
                  updateElement(selectedElement.id, { content: newContent });
                }} className="absolute top-1 right-1 text-red-500 text-xs">X</button>
                <input type="text" value={item.title} onChange={(e) => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent[index].title = e.target.value;
                  updateElement(selectedElement.id, { content: newContent });
                }} placeholder="Title" className="w-full px-2 py-1 border rounded-md text-sm" />
                <textarea value={item.description} onChange={(e) => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent[index].description = e.target.value;
                  updateElement(selectedElement.id, { content: newContent });
                }} placeholder="Description" className="w-full px-2 py-1 border rounded-md text-sm" rows={2} />
              </div>
            ))}
            <button onClick={() => updateElement(selectedElement.id, { content: [...(selectedElement.content as any[]), { title: 'New Step', description: 'Description' }] })} className="w-full py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200">+ Add Step</button>
          </div>
        );
      case 'rating':
        return (
          <input type="number" min="0" max="5" value={selectedElement.content as number} onChange={(e) => updateElement(selectedElement.id, { content: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-md text-sm" />
        );
      case 'newsletter':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).title} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), title: e.target.value } })} placeholder="Title" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).placeholder} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), placeholder: e.target.value } })} placeholder="Placeholder" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).buttonText} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), buttonText: e.target.value } })} placeholder="Button Text" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).name} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), name: e.target.value } })} placeholder="Name" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).role} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), role: e.target.value } })} placeholder="Role" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).avatarUrl} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), avatarUrl: e.target.value } })} placeholder="Avatar URL" className="w-full px-3 py-2 border rounded-md text-sm" />
            <textarea value={(selectedElement.content as any).bio} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), bio: e.target.value } })} placeholder="Bio" className="w-full px-3 py-2 border rounded-md text-sm" rows={3} />
          </div>
        );
      case 'banner':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).text} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), text: e.target.value } })} placeholder="Banner Text" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).link} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), link: e.target.value } })} placeholder="Link URL" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );
      case 'footer':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).copyright} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), copyright: e.target.value } })} placeholder="Copyright Text" className="w-full px-3 py-2 border rounded-md text-sm" />
            <label className="block text-xs text-gray-500 mt-2">Links (one per line)</label>
            <textarea value={((selectedElement.content as any).links as string[]).join('\n')} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), links: e.target.value.split('\n') } })} className="w-full px-3 py-2 border rounded-md text-sm" rows={4} />
          </div>
        );
      case 'logo':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).url} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), url: e.target.value } })} placeholder="Image URL" className="w-full px-3 py-2 border rounded-md text-sm" />
            <input type="text" value={(selectedElement.content as any).alt} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), alt: e.target.value } })} placeholder="Alt Text" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );
      case 'callout':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).emoji} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), emoji: e.target.value } })} placeholder="Emoji" className="w-full px-3 py-2 border rounded-md text-sm" />
            <textarea value={(selectedElement.content as any).text} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), text: e.target.value } })} placeholder="Text" className="w-full px-3 py-2 border rounded-md text-sm" rows={3} />
          </div>
        );
      case 'checklist':
        return (
          <div className="space-y-4">
            {(selectedElement.content as any[]).map((item, index) => (
              <div key={index} className="flex items-center gap-2 border p-2 rounded-md relative">
                <input type="checkbox" checked={item.checked} onChange={(e) => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent[index].checked = e.target.checked;
                  updateElement(selectedElement.id, { content: newContent });
                }} />
                <input type="text" value={item.text} onChange={(e) => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent[index].text = e.target.value;
                  updateElement(selectedElement.id, { content: newContent });
                }} placeholder="Task" className="flex-1 px-2 py-1 border rounded-md text-sm" />
                <button onClick={() => {
                  const newContent = [...(selectedElement.content as any[])];
                  newContent.splice(index, 1);
                  updateElement(selectedElement.id, { content: newContent });
                }} className="text-red-500 text-xs">X</button>
              </div>
            ))}
            <button onClick={() => updateElement(selectedElement.id, { content: [...(selectedElement.content as any[]), { text: 'New Task', checked: false }] })} className="w-full py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200">+ Add Task</button>
          </div>
        );
      case 'toggle':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={(selectedElement.content as any).checked} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), checked: e.target.checked } })} />
              <label className="text-sm">Is Checked</label>
            </div>
            <input type="text" value={(selectedElement.content as any).label} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), label: e.target.value } })} placeholder="Label" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );
      case 'auth_form':
        return (
          <div className="space-y-2">
            <input type="text" value={(selectedElement.content as any).title} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), title: e.target.value } })} placeholder="Form Title" className="w-full px-3 py-2 border rounded-md text-sm" />
            <select value={(selectedElement.content as any).mode} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), mode: e.target.value } })} className="w-full px-3 py-2 border rounded-md text-sm">
              <option value="signup">Sign Up</option>
              <option value="login">Login</option>
            </select>
            <input type="text" value={(selectedElement.content as any).buttonText} onChange={(e) => updateElement(selectedElement.id, { content: { ...(selectedElement.content as any), buttonText: e.target.value } })} placeholder="Button Text" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
        );

      case 'code':
      case 'quote':
        return (
          <textarea
            value={selectedElement.content as string}
            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm font-mono"
            rows={6}
          />
        );
      case 'image':
      case 'video':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={selectedElement.content as string}
              onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder={`${selectedElement.type === 'image' ? 'Image' : 'Video'} URL`}
            />
            {selectedElement.type === 'image' && userSettings?.cloudinaryCloudName && userSettings?.cloudinaryUploadPreset && (
              <div className="pt-2">
                <CloudinaryUploadWidget 
                   cloudName={userSettings.cloudinaryCloudName} 
                   uploadPreset={userSettings.cloudinaryUploadPreset} 
                   onSuccess={(url) => updateElement(selectedElement.id, { content: url })}
                   className="w-full"
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={selectedElement.content as string}
            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        );
    }
  };

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
            onClick={() => window.open(getPublicUrl(), '_blank')}
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
                {renderContentEditor()}
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

              {/* Database Connection */}
              {(selectedElement.type === 'list' || selectedElement.type === 'form') && (
                <div className="space-y-4 mt-4 border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900">Database Connection</h3>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Connect to Collection</label>
                    <select
                      value={selectedElement.dataSource?.tableId || ''}
                      onChange={(e) => updateElement(selectedElement.id, { dataSource: { tableId: e.target.value } })}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">-- Select a Collection --</option>
                      {userTables.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedElement.dataSource?.tableId && selectedElement.type === 'list' && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
                      Connected to <b>{userTables.find(t => t.id === selectedElement.dataSource?.tableId)?.name}</b>. In preview, this list will display dynamic results.
                    </div>
                  )}
                  {selectedElement.dataSource?.tableId && selectedElement.type === 'form' && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
                      Form is linked. When submitted, a record will be added to <b>{userTables.find(t => t.id === selectedElement.dataSource?.tableId)?.name}</b>.
                    </div>
                  )}
                </div>
              )}

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
                  value={getPublicUrl()}
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
                  onClick={() => window.open(getPublicUrl(), '_blank')}
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
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={element.content} alt="User added" style={element.style} className="object-cover" draggable={false} />
        );
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
      case 'accordion':
        return (
          <div style={element.style}>
            {(element.content as any[]).map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  {item.title} <span>+</span>
                </div>
              </div>
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
          <div style={{ ...element.style, gap: '10px' }}>
            {(element.content as string[]).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img} alt={`Gallery ${i}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} draggable={false} />
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
              <span key={i} style={{ textTransform: 'capitalize' }}>{network}</span>
            ))}
          </div>
        );
      case 'form':
        return (
          <div style={element.style}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>{element.content.title}</h3>
            <input type="text" placeholder="Name" style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <input type="email" placeholder="Email" style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
            <button style={{ width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px' }}>{element.content.buttonText}</button>
          </div>
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
          <div style={{ ...element.style, pointerEvents: 'none' }}>
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
      case 'auth_form':
        return (
          <form style={element.style} onSubmit={(e) => e.preventDefault()}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>{element.content.title}</h3>
            <input type="email" placeholder="Email" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }} disabled />
            <input type="password" placeholder="Password" style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }} disabled />
            <button type="button" style={{ width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>{element.content.buttonText}</button>
            {element.content.mode === 'signup' && (
              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Already have an account? Login
              </div>
            )}
            {element.content.mode === 'login' && (
              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Don&apos;t have an account? Sign Up
              </div>
            )}
          </form>
        );
      case 'signature':
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
