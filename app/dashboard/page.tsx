'use client';

// ... imports
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Plus, Edit, ExternalLink, Layout as LayoutIcon } from 'lucide-react';
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
    
    try {
      const docRef = await addDoc(collection(db, 'pages'), {
        userId: user.uid,
        title: newPageTitle,
        slug,
        content: JSON.stringify({ elements: [] }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsCreateModalOpen(false);
      router.push(`/builder/${docRef.id}`);
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
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (rootDomain) {
      const protocol = rootDomain.includes('localhost') ? 'http' : 'https';
      return `${protocol}://${username}.${rootDomain}/${slug}`;
    }
    return `/${username}/${slug}`;
  };

  if (!username && user) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Choose a Username</h1>
          <p className="text-gray-600 mb-6 text-center">This will be used for your public URL (e.g., yoursite.com/username)</p>
          <form onSubmit={handleSetUsername} className="space-y-4">
            <div>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="username"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                pattern="[a-zA-Z0-9_]+"
                title="Only letters, numbers, and underscores allowed"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              Set Username
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Your Pages</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-4 h-4 mr-2" /> Create New Page
        </button>
      </div>

      {loadingPages ? (
        <div className="text-center py-12 text-gray-500">Loading pages...</div>
      ) : pages.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <LayoutIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No pages yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Start building your website by creating your first page.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-blue-600 font-medium hover:underline inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Create your first page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div key={page.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition flex flex-col">
              <div className="p-6 flex-1">
                <h3 className="font-semibold text-lg mb-1 truncate text-gray-900">{page.title}</h3>
                <p className="text-sm text-gray-500 truncate">{getPublicUrl(page.slug)}</p>
              </div>
              <div className="bg-gray-50 border-t flex">
                <Link
                  href={`/builder/${page.id}`}
                  className="flex-1 text-gray-700 py-3 flex items-center justify-center hover:bg-gray-100 transition border-r font-medium text-sm"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Link>
                <Link
                  href={getPublicUrl(page.slug)}
                  target="_blank"
                  className="flex-1 text-blue-600 py-3 flex items-center justify-center hover:bg-blue-50 transition font-medium text-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Page Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100">
            <div className="px-6 py-5 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Create New Page</h3>
            </div>
            <form onSubmit={handleCreatePage} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="e.g. Home, About Us, Contact"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPageTitle.trim()}
                  className="px-5 py-2.5 bg-blue-600 font-medium text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                  {isCreating ? 'Creating...' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
