'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('files').select('*');
    if (error) {
      console.error('Error fetching files:', error);
      setError(error.message);
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('files').select('*');
      if (!mounted) return;
      if (error) {
        console.error('Error fetching files:', error);
        setError(error.message);
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Files</h1>
          <button onClick={fetchFiles} className="text-sm bg-blue-500 text-white px-3 py-1 rounded">Refresh</button>
      </div>
      {loading ? (
        <p className="mt-4 text-gray-600">Loading...</p>
      ) : error ? (
        <p className="mt-4 text-red-600">Error: {error}</p>
      ) : files.length === 0 ? (
        <p className="mt-4 text-gray-600">No files uploaded yet.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4">
          {files.map((file) => (
            <li key={file.id} className="p-4 border rounded shadow-sm">
              <p className="font-medium">{file.name || (file.url ? file.url.split('/').pop() : 'Unnamed File')}</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View File
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
