'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, ChevronDown, FileSpreadsheet, Database, Layers, Check, Sparkles, FolderDown, FileJson } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  FIREBASE_PRESETS, 
  downloadFirebaseJSON, 
  exportRecordsToCSV, 
  exportRecordsToFirebaseJSON 
} from '@/lib/csv-helper';

export default function DashboardTopDownloadButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch tables to provide instant 1-click export for user's tables
  useEffect(() => {
    const fetchUserTables = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('tables')
          .select('*')
          .eq('user_id', user.id);
        if (data) setTables(data);
      } catch (e) {
        console.error('Error fetching tables for top download bar', e);
      }
    };
    fetchUserTables();
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadFirebasePreset = (presetId: string) => {
    setDownloading(presetId);
    downloadFirebaseJSON(presetId);
    setTimeout(() => {
      setDownloading(null);
      setIsOpen(false);
    }, 1200);
  };

  const handleDownloadTableData = async (table: any, format: 'csv' | 'json') => {
    setDownloading(`${table.id}_${format}`);
    try {
      const { data: records } = await supabase
        .from('records')
        .select('*')
        .eq('table_id', table.id);

      const parsedRecords = (records || []).map((r: any) => ({
        id: r.id,
        created_at: r.created_at || r.createdAt,
        ...(typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {})
      }));

      const fields = typeof table.fields === 'string' ? JSON.parse(table.fields) : table.fields || [];

      if (format === 'json') {
        exportRecordsToFirebaseJSON(table.name, parsedRecords);
      } else {
        exportRecordsToCSV(table.name, fields, parsedRecords);
      }
    } catch (err) {
      console.error('Download table failed:', err);
    } finally {
      setTimeout(() => {
        setDownloading(null);
        setIsOpen(false);
      }, 1200);
    }
  };

  return (
    <div className="relative" ref={menuRef} dir="rtl">
      {/* Top Header Download Button */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-500/30"
          title="تحميل قوالب وتصدير بيانات Firebase و CSV"
        >
          <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
            <Download className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold">تحميل الملف</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderDown className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs">تحميل وتصدير البيانات</span>
            </div>
            <span className="text-3xs font-mono bg-white/10 px-2 py-0.5 rounded text-amber-300">
              Firebase & CSV
            </span>
          </div>

          <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
            {/* Quick Firebase Presets Section */}
            <div className="pt-1 pb-1 px-1">
              <span className="text-3xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <FileJson className="w-3 h-3 text-amber-500" />
                قوالب مجموعات Firebase Firestore الجاهزة:
              </span>
            </div>

            {FIREBASE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleDownloadFirebasePreset(preset.id)}
                disabled={downloading === preset.id}
                className="w-full text-right px-2.5 py-2 rounded-md hover:bg-amber-50/60 flex items-center justify-between transition cursor-pointer text-xs group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-gray-800 text-xs">{preset.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {downloading === preset.id ? (
                    <span className="text-3xs text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> تم
                    </span>
                  ) : (
                    <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600 transition" />
                  )}
                </div>
              </button>
            ))}

            {/* User Custom Tables Section if available */}
            {tables.length > 0 && (
              <>
                <div className="pt-2.5 pb-1 px-1 border-t border-gray-100">
                  <span className="text-3xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-600" />
                    تصدير جداولك الحالية:
                  </span>
                </div>
                {tables.map((t) => (
                  <div
                    key={t.id}
                    className="px-2.5 py-2 rounded-md hover:bg-gray-50 flex items-center justify-between transition text-xs"
                  >
                    <span className="font-medium text-gray-800 truncate max-w-[140px]">
                      {t.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDownloadTableData(t, 'csv')}
                        disabled={downloading === `${t.id}_csv`}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-3xs font-semibold cursor-pointer transition flex items-center gap-0.5"
                        title="تصدير كملف CSV"
                      >
                        <Download className="w-2.5 h-2.5" /> CSV
                      </button>
                      <button
                        onClick={() => handleDownloadTableData(t, 'json')}
                        disabled={downloading === `${t.id}_json`}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-3xs font-semibold cursor-pointer transition flex items-center gap-0.5"
                        title="تصدير كملف Firebase JSON"
                      >
                        <FileJson className="w-2.5 h-2.5" /> JSON
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-3xs text-gray-500">
              الملفات مدعومة بصيغ JSON و CSV المتوافقة مع Firebase و Excel
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
