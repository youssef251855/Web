'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader, AlertCircle } from 'lucide-react';

type Result = Record<string, any>;

export default function DataSearch({ tableId, placeholder = "Search..." }: { tableId: string, placeholder?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError('');
    setResults([]);
    setHasSearched(true);

    try {
      const term = searchTerm.trim().toLowerCase();
      
      const { data: allData, error } = await supabase
        .from('records')
        .select('data')
        .eq('table_id', tableId);

      if (error) throw error;
      
      if (allData) {
        const matchedRecords = allData.filter(r => {
          const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
          return Object.values(d).some(val => String(val).toLowerCase().includes(term));
        }).map(r => typeof r.data === 'string' ? JSON.parse(r.data) : r.data);
        
        setResults(matchedRecords);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while connecting to the database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col pointer-events-auto">
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              required
            />
            <Search className="absolute left-3 top-3.5 text-zinc-400 w-5 h-5" />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 bg-zinc-900 text-white rounded-xl font-semibold flex items-center justify-center hover:bg-zinc-800 transition disabled:opacity-70"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 mb-4">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3">
          {hasSearched && !loading && results.length === 0 && !error && (
            <div className="text-center p-8 bg-zinc-50 rounded-xl text-zinc-500 border border-zinc-100">
               No results found.
            </div>
          )}
          {results.map((result, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200">
                {Object.entries(result).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1.5 border-b border-zinc-50 last:border-0">
                    <span className="text-zinc-500 text-sm">{key}</span>
                    <span className="font-medium text-zinc-900 text-sm">{String(val)}</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
    </div>
  );
}
