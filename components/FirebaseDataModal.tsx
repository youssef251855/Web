'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Database, 
  Sparkles,
  Layers,
  Cloud
} from 'lucide-react';
import { FIREBASE_PRESETS, downloadFirebasePreset, exportRecordsToFirebaseJSON, exportRecordsToCSV } from '@/lib/csv-helper';
import { supabase } from '@/lib/supabase';

interface FirebaseDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable?: {
    name: string;
    fields: any[];
  };
  onImportComplete?: () => void;
}

export default function FirebaseDataModal({
  isOpen,
  onClose,
  currentTable,
  onImportComplete
}: FirebaseDataModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'export' | 'import'>('presets');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');

  if (!isOpen) return null;

  const handleDownloadPreset = (presetId: string, format: 'json' | 'csv') => {
    setDownloadingId(`${presetId}_${format}`);
    downloadFirebasePreset(presetId, format);
    setTimeout(() => {
      setDownloadingId(null);
    }, 1200);
  };

  const handleExportCurrent = async (format: 'json' | 'csv') => {
    if (!currentTable) return;
    setDownloadingId(`current_${format}`);
    try {
      const { data: records } = await supabase
        .from('records')
        .select('*');

      const parsedRecords = (records || []).map((r: any) => ({
        id: r.id,
        created_at: r.created_at,
        ...(typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {})
      }));

      if (format === 'json') {
        exportRecordsToFirebaseJSON(currentTable.name, parsedRecords);
      } else {
        exportRecordsToCSV(currentTable.name, currentTable.fields, parsedRecords);
      }
    } catch (e: any) {
      console.error('Export error:', e);
    } finally {
      setTimeout(() => setDownloadingId(null), 1200);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      let records: any[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        // Simple CSV parse
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.replace(/^["']|["']$/g, '').trim());
            const row: any = {};
            headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
            records.push(row);
          }
        }
      }

      if (records.length === 0) {
        throw new Error('لم يتم العثور على سجلات صالحة في الملف');
      }

      const targetCollection = currentTable?.name || 'imported_records';

      // Insert into Firestore
      await supabase.from(targetCollection).insert(records);

      setImportStatus({
        type: 'success',
        message: `تم استيراد ${records.length} مستند بنجاح إلى Firebase (${targetCollection})!`
      });

      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'فشل استيراد الملف إلى Firebase'
      });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                مركز إدارة وتصدير Firebase Firestore
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  JSON & CSV
                </span>
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                تصدير واستيراد مجموعات Firestore وقوالب البيانات الجاهزة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-4 pt-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            قوالب ومجموعات Firebase الجاهزة
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            تصدير الجدول الحالي
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'import'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            استيراد إلى Firebase
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                حمل نماذج ومستندات جاهزة بتنسيق JSON أو CSV لتضمينها مباشرة في قاعدة بيانات Firebase Firestore:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FIREBASE_PRESETS.map((preset) => (
                  <div 
                    key={preset.id} 
                    className="p-3.5 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/20 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {preset.collection}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleDownloadPreset(preset.id, 'json')}
                        disabled={downloadingId === `${preset.id}_json`}
                        className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                      >
                        {downloadingId === `${preset.id}_json` ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <FileJson className="w-3 h-3" />
                        )}
                        <span>تحميل JSON</span>
                      </button>

                      <button
                        onClick={() => handleDownloadPreset(preset.id, 'csv')}
                        disabled={downloadingId === `${preset.id}_csv`}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition shadow-xs disabled:opacity-50"
                      >
                        {downloadingId === `${preset.id}_csv` ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <FileSpreadsheet className="w-3 h-3" />
                        )}
                        <span>تحميل CSV</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4 text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">
                  تصدير بيانات الجدول الحالي ({currentTable?.name || 'الجدول الرئيسي'})
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                  اختر الصيغة المناسبة لتصدير سجلاتك المتزامنة مع Firebase Firestore:
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => handleExportCurrent('json')}
                  disabled={downloadingId === 'current_json'}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <FileJson className="w-4 h-4" />
                  <span>تصدير كـ Firebase JSON</span>
                </button>

                <button
                  onClick={() => handleExportCurrent('csv')}
                  disabled={downloadingId === 'current_csv'}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير كـ Excel CSV</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-amber-300 rounded-2xl bg-amber-50/30 text-center relative hover:bg-amber-50/50 transition">
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleImportFile}
                  disabled={importing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-gray-900">
                  {importing ? 'جاري الاستيراد إلى Firebase...' : 'اختر ملف JSON أو CSV للاستيراد'}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  سيتم إنشاء المستندات تلقائياً داخل Firebase Firestore
                </p>
              </div>

              {importStatus && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  importStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {importStatus.type === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5 text-blue-500" />
            الصور والفيديوهات تُرفع عبر Cloudinary
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
