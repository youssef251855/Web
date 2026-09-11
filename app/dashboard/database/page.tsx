'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, Database as DbIcon, Type, Hash, Calendar, Settings, ListPlus, LayoutList, Upload, Download, FileSpreadsheet, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { autoSeedTableRows, generateMockRows } from '@/lib/table-generator';
import { exportRecordsToCSV, downloadSampleCSVTemplate, parseCSVText } from '@/lib/csv-helper';
import AppwriteCSVModal from '@/components/AppwriteCSVModal';

interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
}

interface Table {
  id: string;
  name: string;
  fields: Field[];
}

export default function DatabasePage() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [viewMode, setViewMode] = useState<'schema' | 'data'>('schema');
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isAppwriteModalOpen, setIsAppwriteModalOpen] = useState(false);

  useEffect(() => {
    const fetchTables = async () => {

      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('tables')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        const fetchedTables: Table[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          fields: typeof d.fields === 'string' ? JSON.parse(d.fields) : d.fields,
        }));
        
        setTables(fetchedTables);
        if (fetchedTables.length > 0) setSelectedTable(fetchedTables[0]);
      } catch (error) {
        console.error("Error fetching tables", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [user]);

  useEffect(() => {
    const fetchTableRecords = async () => {
      if (viewMode === 'data' && selectedTable) {
        setLoadingRecords(true);
        try {
          const { data, error } = await supabase
            .from('records')
            .select('*')
            .eq('table_id', selectedTable.id);
            
          if (error) throw error;
          
          const parsedRecords = (data || []).map((record: any) => ({
            id: record.id,
            created_at: record.created_at,
            ...(typeof record.data === 'string' ? JSON.parse(record.data) : record.data)
          }));
          
          setRecords(parsedRecords);
        } catch (error) {
          console.error("Error fetching records", error);
        } finally {
          setLoadingRecords(false);
        }
      }
    };
    
    fetchTableRecords();
  }, [viewMode, selectedTable]);

  const [isGeneratingRows, setIsGeneratingRows] = useState(false);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTableName.trim()) return;
    setIsCreatingTable(true);
    
    // Auto-create standard intuitive fields based on table name
    const defaultFields: Field[] = [
      { id: '1', name: 'Name', type: 'text' },
      { id: '2', name: 'Status', type: 'text' },
      { id: '3', name: 'Created_Date', type: 'date' }
    ];

    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          user_id: user.id,
          name: newTableName.trim(),
          fields: JSON.stringify(defaultFields),
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      const newTable: Table = { id: data.id, name: newTableName.trim(), fields: defaultFields };
      setTables([...tables, newTable]);
      setSelectedTable(newTable);
      setNewTableName('');

      // Auto-generate and seed 3 initial demo rows right away!
      const seedResult = await autoSeedTableRows(data.id, user.id, newTable.name, defaultFields, 3);
      if (seedResult.success && seedResult.inserted.length > 0) {
        setRecords(seedResult.inserted);
      }
    } catch (error) {
      console.error("Error creating table", error);
    } finally {
      setIsCreatingTable(false);
    }
  };

  const handleAutoGenerateRows = async (count: number = 3) => {
    if (!selectedTable || !user) return;
    setIsGeneratingRows(true);
    try {
      const seedResult = await autoSeedTableRows(
        selectedTable.id,
        user.id,
        selectedTable.name,
        selectedTable.fields,
        count
      );
      if (seedResult.success && seedResult.inserted) {
        setRecords(prev => [...prev, ...seedResult.inserted]);
      } else {
        alert("تعذر توليد الصفوف تلقائياً. تأكد من إعدادات قاعدة البيانات.");
      }
    } catch (err) {
      console.error("Error auto-generating rows:", err);
    } finally {
      setIsGeneratingRows(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الصف؟')) return;
    try {
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', recordId);
      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (err: any) {
      console.error('Error deleting record:', err);
      alert('فشل حذف السجل: ' + err.message);
    }
  };

  const handleClearAllRecords = async () => {
    if (!selectedTable || !confirm('هل أنت متأكد من حذف جميع الصفوف في هذا الجدول؟')) return;
    try {
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('table_id', selectedTable.id);
      if (error) throw error;
      setRecords([]);
    } catch (err: any) {
      console.error('Error clearing records:', err);
      alert('فشل مسح السجلات: ' + err.message);
    }
  };

  const addField = () => {
    if (!selectedTable) return;
    const newField: Field = { id: Date.now().toString(), name: 'New Field', type: 'text' };
    const updatedFields = [...selectedTable.fields, newField];
    handleUpdateTable(updatedFields);
  };

  const updateField = (fieldId: string, updates: Partial<Field>) => {
    if (!selectedTable) return;
    const updatedFields = selectedTable.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
    handleUpdateTable(updatedFields);
  };

  const removeField = (fieldId: string) => {
    if (!selectedTable) return;
    const updatedFields = selectedTable.fields.filter(f => f.id !== fieldId);
    handleUpdateTable(updatedFields);
  };

  const handleUpdateTable = async (updatedFields: Field[]) => {
    if (!selectedTable) return;
    
    // Optimistic update
    const updatedTable = { ...selectedTable, fields: updatedFields };
    setSelectedTable(updatedTable);
    setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));

    try {
      const { error } = await supabase
        .from('tables')
        .update({
          fields: JSON.stringify(updatedFields),
        })
        .eq('id', selectedTable.id);
        
      if (error) throw error;
    } catch (error) {
      console.error("Error updating table", error);
    }
  };

  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecordData, setNewRecordData] = useState<any>({});

  const handleOpenAddRecord = () => {
    if (!selectedTable) return;
    const defaultData = selectedTable.fields.reduce((acc, field) => {
        acc[field.name] = '';
        return acc;
    }, {} as any);
    setNewRecordData(defaultData);
    setIsAddingRecord(true);
  };

  const handleAddRecord = async () => {
    if (!selectedTable || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('records')
        .insert({
          table_id: selectedTable.id,
          user_id: user.id,
          data: JSON.stringify(newRecordData),
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      const newRecord = {
          id: data.id,
          created_at: data.created_at,
          ...newRecordData
      };
      
      setRecords([...records, newRecord]);
      setIsAddingRecord(false);
    } catch (error) {
       console.error("Error adding record", error);
       alert("Failed to add record.");
    }
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTable || !user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        
        let parsedData;
        try {
          parsedData = JSON.parse(result);
        } catch (e) {
          alert('Invalid JSON file.');
          return;
        }

        if (!Array.isArray(parsedData)) {
          alert('JSON file must contain an array of objects.');
          return;
        }

        let addedCount = 0;
        for (const item of parsedData) {
          const { error } = await supabase
            .from('records')
            .insert({
              table_id: selectedTable.id,
              user_id: user.id,
              data: JSON.stringify(item),
            });
          if (!error) addedCount++;
        }

        alert(`Successfully imported ${addedCount} records.`);
      } catch (error) {
        console.error('Failed to import JSON', error);
        alert('Failed to import JSON. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCSV = () => {
    if (!selectedTable) return;
    const success = exportRecordsToCSV(selectedTable.name, selectedTable.fields, records);
    if (!success) {
      alert('حدث خطأ أثناء تصدير ملف CSV');
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedTable) return;
    downloadSampleCSVTemplate(selectedTable.name, selectedTable.fields);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTable || !user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const parseResult = parseCSVText(text);
        if (parseResult.error || parseResult.rows.length === 0) {
          alert(parseResult.error || 'ملف CSV لا يحتوي على أي صفوف صالحة للإدراج.');
          return;
        }

        // Check if there are new columns in CSV that don't exist in current table fields
        const existingFieldNames = new Set(selectedTable.fields.map(f => f.name.toLowerCase()));
        const newFieldsToAdd: Field[] = [];
        parseResult.headers.forEach((h, idx) => {
          if (h.toLowerCase() !== 'id' && h.toLowerCase() !== 'created_at' && !existingFieldNames.has(h.toLowerCase())) {
            newFieldsToAdd.push({
              id: `${Date.now()}_${idx}`,
              name: h,
              type: 'text'
            });
            existingFieldNames.add(h.toLowerCase());
          }
        });

        // Update table schema if new fields found
        let currentFields = selectedTable.fields;
        if (newFieldsToAdd.length > 0) {
          currentFields = [...selectedTable.fields, ...newFieldsToAdd];
          await supabase
            .from('tables')
            .update({ fields: JSON.stringify(currentFields) })
            .eq('id', selectedTable.id);
          
          setSelectedTable({ ...selectedTable, fields: currentFields });
          setTables(tables.map(t => t.id === selectedTable.id ? { ...t, fields: currentFields } : t));
        }

        // Insert rows into Supabase records
        const recordsToInsert = parseResult.rows.map(row => ({
          table_id: selectedTable.id,
          user_id: user.id,
          data: JSON.stringify(row),
        }));

        const { data, error } = await supabase
          .from('records')
          .insert(recordsToInsert)
          .select('*');

        if (error) throw error;

        const insertedRecords = (data || []).map((record: any, index: number) => ({
          id: record.id,
          created_at: record.created_at || new Date().toISOString(),
          ...(typeof record.data === 'string' ? JSON.parse(record.data) : record.data || parseResult.rows[index] || {})
        }));

        setRecords(prev => [...prev, ...insertedRecords]);
        alert(`🎉 تم استيراد ${insertedRecords.length} صف بنجاح من ملف الـ CSV!`);
      } catch (error: any) {
        console.error('Failed to import CSV:', error);
        alert('فشل استيراد ملف CSV: ' + (error.message || 'يرجى التأكد من صحة الملف'));
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleCreateNewTableFromCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'New Collection';
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        const parseResult = parseCSVText(text);
        if (parseResult.error || parseResult.rows.length === 0) {
          alert(parseResult.error || 'ملف CSV لا يحتوي على بيانات صالحة.');
          return;
        }

        const fields: Field[] = parseResult.headers
          .filter(h => h.toLowerCase() !== 'id' && h.toLowerCase() !== 'created_at')
          .map((h, idx) => ({
            id: String(idx + 1),
            name: h,
            type: typeof parseResult.rows[0]?.[h] === 'number' ? 'number' : 'text'
          }));

        if (fields.length === 0) {
          fields.push({ id: '1', name: 'Name', type: 'text' });
        }

        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .insert({
            user_id: user.id,
            name: rawName,
            fields: JSON.stringify(fields),
          })
          .select('id')
          .single();

        if (tableError) throw tableError;

        const newTable: Table = { id: tableData.id, name: rawName, fields };

        // Insert records
        const recordsToInsert = parseResult.rows.map(row => ({
          table_id: tableData.id,
          user_id: user.id,
          data: JSON.stringify(row),
        }));

        const { data: insertedRecords, error: recordError } = await supabase
          .from('records')
          .insert(recordsToInsert)
          .select('*');

        if (recordError) throw recordError;

        const parsedRecords = (insertedRecords || []).map((record: any, index: number) => ({
          id: record.id,
          created_at: record.created_at || new Date().toISOString(),
          ...(typeof record.data === 'string' ? JSON.parse(record.data) : record.data || parseResult.rows[index] || {})
        }));

        setTables(prev => [...prev, newTable]);
        setSelectedTable(newTable);
        setRecords(parsedRecords);
        alert(`🎉 تم إنشاء جدول "${rawName}" واستيراد ${parsedRecords.length} سجل بنجاح من ملف الـ CSV!`);
      } catch (err: any) {
        console.error('Error creating table from CSV:', err);
        alert('فشل إنشاء الجدول من ملف CSV: ' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleDeleteTable = async () => {
    if (!selectedTable || !confirm('Are you sure you want to delete this table? All data will be lost.')) return;
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', selectedTable.id);
        
      if (error) throw error;
      
      const newTables = tables.filter(t => t.id !== selectedTable.id);
      setTables(newTables);
      setSelectedTable(newTables.length > 0 ? newTables[0] : null);
    } catch (error) {
      console.error("Error deleting table", error);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading tables...</div>;

  return (
    <div className="flex h-full">
      {/* Tables List Sidebar */}
      <div className="w-64 border-r bg-white flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800 flex items-center">
            <DbIcon className="w-4 h-4 mr-2" /> Collections
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center justify-between group transition ${selectedTable?.id === table.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <div className="flex items-center">
                <LayoutList className="w-4 h-4 mr-2 opacity-50" />
                {table.name}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50 flex flex-col gap-2">
          <form onSubmit={handleCreateTable} className="flex gap-2">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="New Collection..."
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <button type="submit" disabled={isCreatingTable} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <input
            type="file"
            accept=".csv,text/csv"
            id="create-table-csv-input"
            className="hidden"
            onChange={handleCreateNewTableFromCSV}
          />
          <button
            type="button"
            onClick={() => document.getElementById('create-table-csv-input')?.click()}
            className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-md text-xs font-semibold flex items-center justify-center transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            إنشاء جدول جديد من ملف CSV
          </button>
        </div>
      </div>

      {/* Editor Main */}
      <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
        {selectedTable ? (
          <>
            <div className="bg-white border-b px-8 py-6 flex flex-col shrink-0 gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{selectedTable.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage schema and data for this collection.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {viewMode === 'data' && (
                    <>
                      <div className="flex items-center rounded-md border border-indigo-200 bg-indigo-50/70 p-0.5 shadow-2xs">
                        <button
                          onClick={() => handleAutoGenerateRows(3)}
                          disabled={isGeneratingRows}
                          className="text-indigo-700 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-sm transition flex items-center text-xs font-semibold disabled:opacity-50"
                          title="إنشاء 3 صفوف ذكية تلقائياً مع قيم نموذجية مطابقة لنوع الحقول"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600 animate-pulse" />
                          {isGeneratingRows ? 'جاري التوليد...' : 'توليد صفوف تلقائياً (3)'}
                        </button>
                        <div className="h-4 w-px bg-indigo-200 mx-0.5" />
                        <button
                          onClick={() => handleAutoGenerateRows(5)}
                          disabled={isGeneratingRows}
                          className="text-indigo-600 hover:bg-indigo-100/80 px-2 py-1.5 rounded-sm transition text-xs font-medium disabled:opacity-50"
                          title="توليد 5 صفوف"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleAutoGenerateRows(10)}
                          disabled={isGeneratingRows}
                          className="text-indigo-600 hover:bg-indigo-100/80 px-2 py-1.5 rounded-sm transition text-xs font-medium disabled:opacity-50"
                          title="توليد 10 صفوف"
                        >
                          +10
                        </button>
                      </div>

                      <button 
                        onClick={handleOpenAddRecord}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md transition flex items-center text-sm font-medium border border-blue-200 shadow-2xs"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Add Record
                      </button>

                      {records.length > 0 && (
                        <button
                          onClick={handleClearAllRecords}
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-2 rounded-md transition flex items-center text-xs font-medium border border-transparent"
                          title="مسح جميع السجلات"
                        >
                          Clear All
                        </button>
                      )}

                      {/* Export CSV */}
                      <button
                        onClick={handleExportCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md transition flex items-center text-xs font-semibold shadow-2xs cursor-pointer"
                        title="تصدير وتحميل بيانات هذا الجدول كملف CSV بالترميز العربي UTF-8"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        تصدير CSV
                      </button>
                    </>
                  )}
                  
                  {/* CSV File Input */}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    id={`import-csv-${selectedTable.id}`}
                    className="hidden"
                    onChange={handleImportCSV}
                  />
                  <button
                    onClick={() => document.getElementById(`import-csv-${selectedTable.id}`)?.click()}
                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-md transition flex items-center text-xs font-semibold shadow-2xs cursor-pointer"
                    title="استيراد وتغذية الجدول بسجلات من ملف CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                    استيراد CSV
                  </button>

                  {/* Appwrite CSV Modal Button */}
                  <button
                    onClick={() => setIsAppwriteModalOpen(true)}
                    className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-3 py-1.5 rounded-md transition flex items-center text-xs font-semibold shadow-2xs cursor-pointer gap-1.5"
                    title="تصدير وتنزيل ملفات CSV متوافقة مع Appwrite Database و Auth"
                  >
                    <DbIcon className="w-3.5 h-3.5" />
                    <span>ملف Appwrite CSV</span>
                  </button>

                  <button
                    onClick={handleDownloadTemplate}
                    className="text-gray-600 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-md transition flex items-center text-xs font-medium shadow-2xs cursor-pointer"
                    title="تحميل نموذج CSV فارغ مع الحقول الحالية"
                  >
                    نموذج CSV
                  </button>

                  <input
                    type="file"
                    accept=".json"
                    id={`import-json-${selectedTable.id}`}
                    className="hidden"
                    onChange={handleImportJson}
                  />
                  <button
                    onClick={() => document.getElementById(`import-json-${selectedTable.id}`)?.click()}
                    className="text-gray-600 hover:bg-gray-100 px-2.5 py-1.5 rounded-md transition flex items-center text-xs font-medium border border-gray-200 shadow-2xs"
                    title="استيراد ملف JSON"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" /> JSON
                  </button>
                  <button 
                    onClick={handleDeleteTable}
                    className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-md transition flex items-center text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Collection
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 border-b">
                <button
                  className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${viewMode === 'schema' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setViewMode('schema')}
                >
                  Schema
                </button>
                <button
                  className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${viewMode === 'data' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setViewMode('data')}
                >
                  Data
                </button>
              </div>
            </div>
            
            {/* Modal for adding record */}
            {isAddingRecord && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                  <h2 className="text-lg font-bold mb-4">Add Record to {selectedTable.name}</h2>
                  {selectedTable.fields.map(field => (
                    <div key={field.id} className="mb-4">
                      <label className="block text-sm font-medium mb-1">{field.name}</label>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={newRecordData[field.name] || ''}
                        onChange={(e) => setNewRecordData({...newRecordData, [field.name]: e.target.value})}
                        className="w-full border rounded p-2"
                      />
                    </div>
                  ))}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddingRecord(false)} className="px-4 py-2 border rounded">Cancel</button>
                    <button onClick={handleAddRecord} className="px-4 py-2 bg-blue-600 text-white rounded">Add Record</button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-8">
              {viewMode === 'schema' ? (
                <div className="max-w-3xl mx-auto bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="w-1/2">Property Name</div>
                    <div className="w-1/3">Property Type</div>
                    <div className="w-1/6 text-right">Actions</div>
                  </div>
                  
                  <div className="divide-y">
                    {selectedTable.fields.map((field, i) => (
                      <div key={`${field.id}-${i}`} className="p-6 flex items-start gap-6 hover:bg-gray-50/50 transition">
                        <div className="w-1/2">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Field name"
                          />
                        </div>
                        <div className="w-1/3">
                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value="text">Text / String</option>
                            <option value="number">Number</option>
                            <option value="boolean">True / False</option>
                            <option value="date">Date</option>
                          </select>
                        </div>
                        <div className="w-1/6 flex justify-end">
                          <button
                            onClick={() => removeField(field.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                            title="Remove field"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-gray-50 border-t">
                    <button
                      onClick={addField}
                      className="flex items-center text-blue-600 font-medium hover:text-blue-700"
                    >
                      <ListPlus className="w-4 h-4 mr-2" /> Add Property
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-white rounded-xl border shadow-sm overflow-hidden overflow-x-auto">
                   {loadingRecords ? (
                     <div className="p-12 text-center text-gray-500 text-sm">
                       <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                       جاري تحميل سجلات البيانات...
                     </div>
                   ) : records.length === 0 ? (
                     <div className="p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                         <Sparkles className="w-6 h-6" />
                       </div>
                       <h3 className="text-base font-bold text-gray-800 mb-1">الجدول فارغ تماماً</h3>
                       <p className="text-xs text-gray-500 mb-5 text-center">
                         لا توجد أي صفوف مسجلة حالياً في هذا الجدول. يمكنك إنشاء صفوف تجريبية فوراً بضغطة زر أو إضافة سجل يدوياً.
                       </p>
                       <div className="flex items-center gap-3">
                         <button
                           onClick={() => handleAutoGenerateRows(3)}
                           disabled={isGeneratingRows}
                           className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center transition cursor-pointer disabled:opacity-50"
                         >
                           <Sparkles className="w-4 h-4 mr-1.5" />
                           {isGeneratingRows ? 'جاري التوليد التلقائي...' : '✨ إنشاء 3 صفوف تلقائية الآن'}
                         </button>
                         <button
                           onClick={handleOpenAddRecord}
                           className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3.5 py-2 rounded-lg transition"
                         >
                           + إضافة يدوية
                         </button>
                       </div>
                     </div>
                   ) : (
                     <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-gray-50 border-b">
                         <tr>
                           <th className="px-6 py-3 font-semibold text-gray-600">ID</th>
                           <th className="px-6 py-3 font-semibold text-gray-600">Created At</th>
                           {selectedTable.fields.map(field => (
                             <th key={field.id} className="px-6 py-3 font-semibold text-gray-600">{field.name}</th>
                           ))}
                           <th className="px-6 py-3 font-semibold text-gray-600 text-center">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                         {records.map((record, index) => (
                           <tr key={`${record.id}-${index}`} className="hover:bg-gray-50/50">
                             <td className="px-6 py-4 font-mono text-xs text-gray-500">{String(record.id).slice(0, 8)}...</td>
                             <td className="px-6 py-4 text-gray-500 text-xs">{new Date(record.created_at).toLocaleString('ar-EG', { hour12: true })}</td>
                             {selectedTable.fields.map((field, i) => (
                               <td key={`cell-${record.id}-${field.id}-${i}`} className="px-6 py-4 truncate max-w-xs text-gray-800">
                                 {String(record[field.name] ?? '-')}
                               </td>
                             ))}
                             <td className="px-6 py-4 text-center">
                               <button
                                 onClick={() => handleDeleteRecord(record.id)}
                                 className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition"
                                 title="حذف هذا الصف"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <DbIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Collection Selected</h3>
              <p className="text-gray-500 mb-6">Select a collection from the sidebar or create a new one.</p>
            </div>
          </div>
        )}
      </div>

      {/* Appwrite CSV Modal */}
      <AppwriteCSVModal
        isOpen={isAppwriteModalOpen}
        onClose={() => setIsAppwriteModalOpen(false)}
        currentTable={selectedTable ? { name: selectedTable.name, fields: selectedTable.fields } : undefined}
        currentRecords={records}
      />
    </div>
  );
}
