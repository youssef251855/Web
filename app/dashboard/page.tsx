'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, ExternalLink, LogOut } from 'lucide-react';
import Link from 'next/link';

interface Page {
  id: string;
  title: string;
  slug: string;
  createdAt: any;
}

export default function Dashboard() {
  const { user, username, loading, logout, setUsername } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

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
      // We can't use alert, so we just log it or we could add an error state
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

  if (loading || (user && loadingPages)) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">WebWeaver Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">@{username}</span>
          <button onClick={logout} className="text-gray-500 hover:text-gray-800 flex items-center">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Your Pages</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> Create New Page
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t created any pages yet.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Create your first page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <div key={page.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
                <h3 className="font-semibold text-lg mb-2 truncate">{page.title}</h3>
                <p className="text-sm text-gray-500 mb-4 truncate">{getPublicUrl(page.slug)}</p>
                <div className="flex space-x-3">
                  <Link
                    href={`/builder/${page.id}`}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md flex items-center justify-center hover:bg-gray-200 transition"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Link>
                  <Link
                    href={getPublicUrl(page.slug)}
                    target="_blank"
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-md flex items-center justify-center hover:bg-blue-100 transition"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Page Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Create New Page</h3>
            </div>
            <form onSubmit={handleCreatePage} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="e.g. My Awesome Portfolio"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPageTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
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
