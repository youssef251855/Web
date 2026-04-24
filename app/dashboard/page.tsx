'use client';

// ... imports
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Plus, Edit, ExternalLink, Layout as LayoutIcon, MessageSquare, CreditCard, PanelsTopLeft } from 'lucide-react';
import Link from 'next/link';

interface Page {
  id: string;
  title: string;
  slug: string;
  createdAt: any;
}

export default function Dashboard() {
  const { user, username, loading, setUsername } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

  useEffect(() => {
    const fetchPages = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'pages'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedPages: Page[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPages.push({ id: doc.id, ...doc.data() } as Page);
        });
        setPages(fetchedPages);
      } catch (error) {
        console.error("Error fetching pages", error);
      } finally {
        setLoadingPages(false);
      }
    };

    if (user) {
      fetchPages();
    }
  }, [user]);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPageTitle.trim()) return;
    
    setIsCreating(true);
    const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    let initialElements: any[] = [];
    if (selectedTemplate === 'chat') {
      initialElements = [
        { id: Date.now().toString(), type: 'heading', content: 'Customer Support Chat', style: { textAlign: 'center', color: '#ffffff', padding: '20px 0', backgroundColor: '#000000' } },
        { id: (Date.now() + 1).toString(), type: 'form', content: { title: 'Message Us', buttonText: 'Send Message' }, style: { width: '400px', margin: '0 auto', backgroundColor: '#18181b', padding: '20px', borderRadius: '8px', color: '#fff' } }
      ];
    } else if (selectedTemplate === 'store') {
      initialElements = [
        { id: Date.now().toString(), type: 'hero', content: { title: 'Welcome to Our Store', subtitle: 'Browse our latest products below.', buttonText: 'Shop Now' }, style: { backgroundColor: '#18181b', color: '#fff', padding: '60px 20px', textAlign: 'center' } },
        { id: (Date.now() + 1).toString(), type: 'gallery', content: ['https://picsum.photos/seed/store1/400/300', 'https://picsum.photos/seed/store2/400/300', 'https://picsum.photos/seed/store3/400/300'], style: { display: 'flex', gap: '20px', padding: '40px 20px', justifyContent: 'center' } }
      ];
    }

    try {
      const docRef = await addDoc(collection(db, 'pages'), {
        userId: user.uid,
        title: newPageTitle,
        slug,
        content: JSON.stringify({ elements: initialElements }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsCreateModalOpen(false);
      window.open(`/builder/${docRef.id}`, `_blank`);
    } catch (error) {
      console.error("Error creating page", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;
    await setUsername(newUsername);
  };

  const getPublicUrl = (slug: string) => {
    let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (rootDomain) {
      rootDomain = rootDomain.replace(/^https?:\/\//, '');
      if (rootDomain.endsWith('.vercel.app') || rootDomain.endsWith('.run.app')) {
        return `/${username}/${slug}`;
      }
      const protocol = rootDomain.includes('localhost') ? 'http' : 'https';
      return `${protocol}://${username}.${rootDomain}/${slug}`;
    }
    return `/${username}/${slug}`;
  };

  if (!username && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#000000]">
        <div className="bg-[#0a0a0a] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-6 mx-auto">
            <PanelsTopLeft className="w-6 h-6 text-zinc-100" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center text-zinc-100">Claim your workspace</h1>
          <p className="text-zinc-400 mb-8 text-center text-sm">Choose a subdomain. This acts as your brand&apos;s unique identifier.</p>
          <form onSubmit={handleSetUsername} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium select-none">
                joex.dev/
              </span>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="company-name"
                className="w-full pl-[85px] pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 text-zinc-100 placeholder:text-zinc-600 font-medium transition-all"
                required
                pattern="[a-zA-Z0-9_-]+"
                title="Only letters, numbers, hyphens, and underscores allowed"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-50">
      <nav className="border-b border-zinc-800 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
               <div className="w-3.5 h-3.5 bg-black rounded-sm" />
            </div>
            <span className="font-semibold tracking-tight">Joex</span>
            <span className="text-zinc-600 mx-2">/</span>
            <span className="text-zinc-400 text-sm">{username}</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700"></div>
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto w-full mt-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Projects</h2>
            <p className="text-zinc-400 text-sm">Manage and deploy your high-performance websites.</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white text-black px-5 py-2.5 rounded-lg flex items-center hover:bg-zinc-200 transition font-medium w-fit shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Plus className="w-4 h-4 mr-2" /> New Project
          </button>
        </div>

        {loadingPages ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-white animate-spin"></div>
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-zinc-800 p-16 rounded-2xl text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
               <LayoutIcon className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">No projects yet</h3>
            <p className="text-zinc-400 mb-8 max-w-sm mx-auto">Start building your high-performance web application by creating your first project.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div key={page.id} className="bg-[#0a0a0a] rounded-xl border border-zinc-800 hover:border-zinc-700 transition flex flex-col group relative overflow-hidden">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg truncate">{page.title}</h3>
                    <div className="flex h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></div>
                  </div>
                  <p className="text-sm text-zinc-400 truncate mb-6">{getPublicUrl(page.slug)}</p>
                  
                  <div className="text-xs font-mono text-zinc-600 bg-zinc-900 px-2 py-1 rounded w-fit capitalize">
                    Production
                  </div>
                </div>
                <div className="bg-zinc-900 flex mt-auto relative z-50">
                  <a
                    href={`/builder/${page.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-zinc-100 py-5 flex items-center justify-center hover:bg-zinc-800 transition border-r border-zinc-800 font-medium active:bg-zinc-700 select-none z-50 cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Builder
                  </a>
                  <a
                    href={getPublicUrl(page.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-zinc-100 py-5 flex items-center justify-center hover:bg-zinc-800 transition font-medium active:bg-zinc-700 select-none z-50 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Visit
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Page Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Create New Project</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  &times;
                </button>
              </div>
              <form onSubmit={handleCreatePage} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Project Title</label>
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="e.g. Next-Gen Marketing Site"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 text-zinc-100 transition-all font-medium"
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-zinc-400 mb-3">Starting Template</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      onClick={() => setSelectedTemplate('blank')}
                      className={`border rounded-xl p-4 cursor-pointer transition relative ${selectedTemplate === 'blank' ? 'border-zinc-400 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'}`}
                    >
                      {selectedTemplate === 'blank' && (
                        <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full"></div>
                      )}
                      <div className={`h-24 border rounded-lg mb-3 flex items-center justify-center ${selectedTemplate === 'blank' ? 'bg-[#000] border-zinc-800 text-zinc-300' : 'bg-[#000] border-zinc-800 text-zinc-600'}`}>
                        <LayoutIcon className="w-8 h-8" />
                      </div>
                      <span className={`block font-medium text-sm ${selectedTemplate === 'blank' ? 'text-zinc-100' : 'text-zinc-500'}`}>Start Empty</span>
                    </div>

                    <div 
                      onClick={() => setSelectedTemplate('chat')}
                      className={`border rounded-xl p-4 cursor-pointer transition relative ${selectedTemplate === 'chat' ? 'border-zinc-400 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'}`}
                    >
                      {selectedTemplate === 'chat' && (
                        <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full"></div>
                      )}
                      <div className={`h-24 border rounded-lg mb-3 flex items-center justify-center ${selectedTemplate === 'chat' ? 'bg-[#000] border-zinc-800 text-zinc-300' : 'bg-[#000] border-zinc-800 text-zinc-600'}`}>
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <span className={`block font-medium text-sm ${selectedTemplate === 'chat' ? 'text-zinc-100' : 'text-zinc-500'}`}>Chat App</span>
                    </div>

                    <div 
                      onClick={() => setSelectedTemplate('store')}
                      className={`border rounded-xl p-4 cursor-pointer transition relative ${selectedTemplate === 'store' ? 'border-zinc-400 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'}`}
                    >
                      {selectedTemplate === 'store' && (
                        <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full"></div>
                      )}
                      <div className={`h-24 border rounded-lg mb-3 flex items-center justify-center ${selectedTemplate === 'store' ? 'bg-[#000] border-zinc-800 text-zinc-300' : 'bg-[#000] border-zinc-800 text-zinc-600'}`}>
                        <CreditCard className="w-8 h-8" />
                      </div>
                      <span className={`block font-medium text-sm ${selectedTemplate === 'store' ? 'text-zinc-100' : 'text-zinc-500'}`}>E-commerce</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 text-zinc-400 font-medium hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newPageTitle.trim()}
                    className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                  >
                    {isCreating ? 'Deploying...' : 'Deploy Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
