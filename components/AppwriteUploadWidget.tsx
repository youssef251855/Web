'use client';

import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface AppwriteUploadWidgetProps {
  buttonText?: string;
  className?: string;
  onSuccess?: (url: string, file: File) => void;
}

export default function AppwriteUploadWidget({
  buttonText = "رفع صورة أو فيديو / Upload Media",
  className = "",
  onSuccess
}: AppwriteUploadWidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'app_uploads');

      const res = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload to Cloudinary failed');
      }

      const json = await res.json();
      const publicUrl = json.secure_url || json.url;

      setUploadedUrl(publicUrl);

      // Store file in Firestore
      try {
        await supabase.from('files').insert({
          name: file.name,
          url: publicUrl,
          resource_type: json.resource_type || (file.type.startsWith('video') ? 'video' : 'image'),
          size: file.size,
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Notice saving file to Firestore:', dbErr);
      }

      if (onSuccess) {
        onSuccess(publicUrl, file);
      }
    } catch (error: any) {
      alert(`Error uploading file: ${error.message || error}`);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ zIndex: 10 }}
      />
      <button
        type="button"
        disabled={uploading}
        className="w-full h-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium shadow-sm"
        style={uploading ? { opacity: 0.7 } : {}}
      >
        {uploading ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> جاري الرفع إلى Cloudinary...</>
        ) : uploadedUrl ? (
          <><CheckCircle2 className="w-5 h-5 mr-2 text-emerald-300" /> تم الرفع بنجاح</>
        ) : (
          <><Upload className="w-5 h-5 mr-2" /> {buttonText}</>
        )}
      </button>
    </div>
  );
}
