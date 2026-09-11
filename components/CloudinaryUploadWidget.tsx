'use client';

import React, { useState, useRef } from 'react';
import { Upload, Video, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export interface CloudinaryUploadWidgetProps {
  buttonText?: string;
  className?: string;
  accept?: string;
  folder?: string;
  onSuccess?: (url: string, fileData: { name: string; type: string; size: number; url: string }) => void;
}

export default function CloudinaryUploadWidget({
  buttonText = 'رفع صورة أو فيديو / Upload Media',
  className = '',
  accept = 'image/*,video/*',
  folder = 'app_media',
  onSuccess,
}: CloudinaryUploadWidgetProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setStatusMessage(null);
    setProgressText('جاري معالجة ورفع الملف إلى Cloudinary...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to upload to Cloudinary');
      }

      const result = await response.json();
      const mediaUrl = result.secure_url || result.url;
      setPreviewUrl(mediaUrl);

      // Save file entry in Firestore files collection
      try {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await supabase.from('files').insert({
          id: fileId,
          name: file.name,
          url: mediaUrl,
          resource_type: result.resource_type || (file.type.startsWith('video') ? 'video' : 'image'),
          size: file.size,
          userId: user?.id || 'public',
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Notice saving file to Firestore:', dbErr);
      }

      setStatusMessage({
        type: 'success',
        text: 'تم رفع الملف بنجاح وتوثيقه في قاعدة البيانات!'
      });

      if (onSuccess) {
        onSuccess(mediaUrl, {
          name: file.name,
          type: file.type,
          size: file.size,
          url: mediaUrl,
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'تعذر رفع الملف'
      });
    } finally {
      setUploading(false);
      setProgressText('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[130px] ${
          isHovered ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-400 bg-gray-50/60'
        } ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-gray-700">{progressText}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-blue-600">
              <Upload className="w-6 h-6" />
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{buttonText}</p>
              <p className="text-xs text-gray-500 mt-0.5">اسحب وأفلت صورة أو مقطع فيديو هنا، أو انقر للاختيار</p>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {previewUrl && (
        <div className="mt-1 p-2 bg-white rounded-lg border flex items-center gap-3">
          {previewUrl.includes('.mp4') || previewUrl.includes('video') ? (
            <video src={previewUrl} className="w-16 h-12 rounded object-cover" controls />
          ) : (
            <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100 shrink-0">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-gray-600 truncate">{previewUrl}</p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              فتح الرابط المباشر
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
