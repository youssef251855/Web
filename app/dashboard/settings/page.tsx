'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save, Image as ImageIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('');
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'user_settings', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCloudinaryCloudName(snap.data().cloudinaryCloudName || '');
          setCloudinaryUploadPreset(snap.data().cloudinaryUploadPreset || '');
        }
      } catch (error) {
        console.error("Error fetching settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'user_settings', user.uid), {
        cloudinaryCloudName,
        cloudinaryUploadPreset,
        updatedAt: new Date()
      }, { merge: true });
      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings", error);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Settings className="w-6 h-6 mr-2" /> Settings
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-blue-500" /> Cloudinary Integration
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Connect your Cloudinary account to allow direct image uploads from the builder.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cloud Name</label>
                <input
                  type="text"
                  value={cloudinaryCloudName}
                  onChange={e => setCloudinaryCloudName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="e.g. dcxyz123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Preset (Unsigned)</label>
                <input
                  type="text"
                  value={cloudinaryUploadPreset}
                  onChange={e => setCloudinaryUploadPreset(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="e.g. my_preset"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {message && (
              <span className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
