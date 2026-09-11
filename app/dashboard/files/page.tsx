'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CloudinaryUploadWidget from '@/components/CloudinaryUploadWidget';
import { RefreshCw, Copy, Check, ExternalLink, Video, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('files').select('*').order('createdAt', { ascending: false });
      if (error) {
        console.error('Error fetching files:', error);
        setError(error.message);
      } else {
        setFiles(data || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد بالتأكيد حذف هذا الملف من القائمة؟ / Delete this file?')) return;
    try {
      await supabase.from('files').eq('id', id).delete();
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (e: any) {
      alert('فشل الحذف: ' + e.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-blue-600" />
            إدارة الوسائط والملفات / Media & Files
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            رفع الصور ومقاطع الفيديو عبر Cloudinary مع التخزين والتنظيم في Firebase Firestore
          </p>
        </div>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm bg-white border border-gray-300 text-gray-700 px-3.5 py-1.5 rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث / Refresh
        </button>
      </div>

      {/* Cloudinary Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          رفع ملفات جديدة إلى Cloudinary (صور وفيديوهات)
        </h2>
        <CloudinaryUploadWidget
          buttonText="اختر أو اسحب صورة أو فيديو للرفع إلى Cloudinary"
          onSuccess={() => {
            fetchFiles();
          }}
        />
      </div>

      {/* Files List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            الملفات المرفوعة ({files.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-xl border">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            جاري تحميل الوسائط...
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
            حدث خطأ أثناء تحميل الملفات: {error}
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-base font-medium text-gray-600">لم يتم رفع أي ملفات بعد</p>
            <p className="text-xs text-gray-400 mt-1">استخدم أداة الرفع بالأعلى لرفع أول صورة أو فيديو عبر Cloudinary</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {files.map((file) => {
              const isVid = file.resource_type === 'video' || (file.url && (file.url.endsWith('.mp4') || file.url.endsWith('.webm')));
              return (
                <div key={file.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    {isVid ? (
                      <video src={file.url} className="w-full h-full object-cover" controls />
                    ) : (
                      <img
                        src={file.url}
                        alt={file.name || 'Media'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-xs">
                      {isVid ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      {isVid ? 'فيديو' : 'صورة'}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm truncate" title={file.name}>
                        {file.name || 'ملف بدون اسم'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {file.createdAt ? new Date(file.createdAt).toLocaleDateString('ar-EG') : 'حديث'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopy(file.url, file.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition"
                      >
                        {copiedId === file.id ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-600" /> تم النسخ</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                        )}
                      </button>

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="فتح في تبويب جديد"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
