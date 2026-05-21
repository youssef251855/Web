import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader } from 'lucide-react';

interface SupabaseUploadWidgetProps {
  buttonText?: string;
  className?: string;
  onSuccess?: (url: string, file: File) => void;
}

export default function SupabaseUploadWidget({
  buttonText = "Upload File",
  className = "",
  onSuccess
}: SupabaseUploadWidgetProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    let originalName = file.name;
    const fileExt = originalName.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      if (onSuccess) {
        onSuccess(publicUrl, file);
      }
    } catch (error: any) {
      alert(`Error uploading file: ${error.message}`);
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
        className="w-full h-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
        style={uploading ? { opacity: 0.7 } : {}}
      >
        {uploading ? (
          <><Loader className="w-5 h-5 mr-2 animate-spin" /> Uploading...</>
        ) : (
          <><Upload className="w-5 h-5 mr-2" /> {buttonText}</>
        )}
      </button>
    </div>
  );
}
