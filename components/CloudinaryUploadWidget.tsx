'use client';

import { useEffect, useRef, useState } from 'react';

interface CloudinaryUploadWidgetProps {
  cloudName: string;
  uploadPreset: string;
  onSuccess: (url: string) => void;
  buttonText?: string;
  className?: string;
}

export default function CloudinaryUploadWidget({ cloudName, uploadPreset, onSuccess, buttonText = 'Upload Image', className = '' }: CloudinaryUploadWidgetProps) {
  const [scriptLoaded, setScriptLoaded] = useState(() => {
    if (typeof window !== 'undefined' && document.getElementById('cloudinary-widget-script') && (window as any).cloudinary) {
      return true;
    }
    return false;
  });
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || scriptLoaded) return;
    
    // Check if script already exists but maybe not fully loaded
    const existingScript = document.getElementById('cloudinary-widget-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'cloudinary-widget-script';
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    
    return () => {
      // Cleanup listener if needed
    };
  }, [scriptLoaded]);

  useEffect(() => {
    if (scriptLoaded && typeof window !== 'undefined' && (window as any).cloudinary) {
      widgetRef.current = (window as any).cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
        },
        (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            onSuccess(result.info.secure_url);
          }
        }
      );
    }
  }, [scriptLoaded, cloudName, uploadPreset, onSuccess]);

  const openWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      alert("Cloudinary widget failed to load or configuration is missing.");
    }
  };

  return (
    <button type="button" onClick={openWidget} className={`px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition ${className}`}>
      {buttonText}
    </button>
  );
}
