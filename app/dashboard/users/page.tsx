'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Users, Trash2, Mail, Shield } from 'lucide-react';

interface SiteUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: any;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'site_users'), where('ownerId', '==', user.uid));
        const snap = await getDocs(q);
        const fetched: SiteUser[] = [];
        snap.forEach(d => {
          fetched.push({ id: d.id, ...d.data() } as SiteUser);
        });
        setSiteUsers(fetched);
      } catch (error) {
        console.error("Error fetching site users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'site_users', id));
      setSiteUsers(siteUsers.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">App Users</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
          <div className="w-1/2 flex items-center"><Mail className="w-4 h-4 mr-2" /> Email</div>
          <div className="w-1/4 flex items-center"><Shield className="w-4 h-4 mr-2" /> Role</div>
          <div className="w-1/4 text-right">Actions</div>
        </div>
        
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : siteUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-gray-500 max-w-sm mx-auto">No users have signed up for your application yet.</p>
            </div>
          ) : siteUsers.map(siteUser => (
            <div key={siteUser.id} className="p-6 flex items-center hover:bg-gray-50 transition">
              <div className="w-1/2 font-medium text-gray-900">{siteUser.email}</div>
              <div className="w-1/4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${siteUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {siteUser.role}
                </span>
              </div>
              <div className="w-1/4 flex justify-end">
                <button
                  onClick={() => handleDelete(siteUser.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  title="Remove user"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
