'use client';

import React, { useState } from 'react';
import { Download, Database, Layers, Check, Sparkles, FileSpreadsheet, FileJson, X, Cloud } from 'lucide-react';
import { 
  APPWRITE_PRESETS, 
  downloadAppwritePresetCSV, 
  exportRecordsToAppwriteCSV,
  FIREBASE_PRESETS,
  downloadFirebasePreset,
  exportRecordsToFirebaseJSON,
  exportRecordsToCSV
} from '@/lib/csv-helper';

interface AppwriteCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable?: {
    name: string;
    fields: Array<{ name: string; type?: string; [key: string]: any }>;
  };
  currentRecords?: Array<Record<string, any>>;
}

export default function AppwriteCSVModal({
  isOpen,
  onClose,
  currentTable,
  currentRecords = []
}: AppwriteCSVModalProps) {
  const [activeTab, setActiveTab] = useState<'firebase' | 'appwrite'>('firebase');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadFirebasePreset = (presetId: string, format: 'json' | 'csv') => {
    downloadFirebasePreset(presetId, format);
    setDownloadSuccess(`${presetId}_${format}`);
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const handleExportCurrentFirebase = (format: 'json' | 'csv') => {
    if (!currentTable) return;
    if (format === 'json') {
      exportRecordsToFirebaseJSON(currentTable.name, currentRecords);
    } else {
      exportRecordsToCSV(currentTable.name, currentTable.fields, currentRecords);
    }
    setDownloadSuccess(`current_${format}`);
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const handleDownloadAppwritePreset = (presetId: string) => {
    const success = downloadAppwritePresetCSV(presetId);
    if (success) {
      setDownloadSuccess(presetId);
      setTimeout(() => setDownloadSuccess(null), 2000);
    }
  };

  const handleExportCurrentAppwrite = () => {
    if (!currentTable) return;
    const success = exportRecordsToAppwriteCSV(currentTable.name, currentTable.fields, currentRecords);
    if (success) {
      setDownloadSuccess('current_appwrite');
      setTimeout(() => setDownloadSuccess(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">مركز تصدير وتحميل البيانات</h3>
                <span className="px-2 py-0.5 text-3xs font-semibold bg-white/20 text-white rounded-full">Firebase & Cloudinary</span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                تصدير وتنزيل ملفات Firestore وقوالب البيانات بالصيغ العالمية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-4 pt-2">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'firebase'
                ? 'border-amber-600 text-amber-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Firebase Firestore (الأساسي)
          </button>
          <button
            onClick={() => setActiveTab('appwrite')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'appwrite'
                ? 'border-rose-600 text-rose-800 bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-rose-600" />
            Appwrite CSV (الأرشيف / ترحيل)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-gray-50/50">
          {activeTab === 'firebase' ? (
            <>
              {/* Export Current Table in Firebase Format */}
              {currentTable && (
                <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <h4 className="font-bold text-gray-900 text-sm">
                          تصدير الجدول الحالي لـ Firebase ({currentTable.name})
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        تصدير {currentRecords.length} سجل متوافق مع مستندات Firebase Firestore.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleExportCurrentFirebase('json')}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition"
                      >
                        {downloadSuccess === 'current_json' ? <Check className="w-3.5 h-3.5" /> : <FileJson className="w-3.5 h-3.5" />}
                        <span>Firebase JSON</span>
                      </button>
                      <button
                        onClick={() => handleExportCurrentFirebase('csv')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition"
                      >
                        {downloadSuccess === 'current_csv' ? <Check className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                        <span>Excel CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pre-built Firebase Collections Presets */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    مجموعات Firebase Firestore الجاهزة للتحميل:
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FIREBASE_PRESETS.map((preset) => (
                    <div 
                      key={preset.id} 
                      className="bg-white p-3.5 rounded-xl border border-gray-200 hover:border-amber-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-gray-900">{preset.name}</span>
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {preset.collection}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleDownloadFirebasePreset(preset.id, 'json')}
                          className="flex-1 py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded flex items-center justify-center gap-1 transition"
                        >
                          {downloadSuccess === `${preset.id}_json` ? <Check className="w-3 h-3" /> : <FileJson className="w-3 h-3" />}
                          <span>JSON</span>
                        </button>
                        <button
                          onClick={() => handleDownloadFirebasePreset(preset.id, 'csv')}
                          className="flex-1 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded flex items-center justify-center gap-1 transition"
                        >
                          {downloadSuccess === `${preset.id}_csv` ? <Check className="w-3 h-3" /> : <FileSpreadsheet className="w-3 h-3" />}
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Appwrite Tab */}
              {currentTable && (
                <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-xs relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        تصدير الجدول الحالي بصيغة Appwrite ({currentTable.name})
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        يتضمن حقول Appwrite الأساسية ($id, $createdAt, $updatedAt, $permissions).
                      </p>
                    </div>
                    <button
                      onClick={handleExportCurrentAppwrite}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center shrink-0 transition cursor-pointer gap-1.5"
                    >
                      {downloadSuccess === 'current_appwrite' ? <Check className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
                      <span>تنزيل Appwrite CSV</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {APPWRITE_PRESETS.map((preset) => (
                  <div key={preset.id} className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-gray-900 mb-1">{preset.name}</h5>
                      <p className="text-[11px] text-gray-500 mb-3">{preset.description}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadAppwritePreset(preset.id)}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      {downloadSuccess === preset.id ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                      <span>تحميل Appwrite CSV</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-blue-500" />
            تخزين الوسائط (صور وفيديوهات) عبر Cloudinary
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
