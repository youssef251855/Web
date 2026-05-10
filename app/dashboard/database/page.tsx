'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, Database as DbIcon, Type, Hash, Calendar, Settings, ListPlus, LayoutList, Upload } from 'lucide-react';

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
          
          const parsedRecords = data.map(record => ({
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

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTableName.trim()) return;
    setIsCreatingTable(true);
    
    // Auto-create an 'id' and 'name' field by default
    const defaultFields: Field[] = [
      { id: Date.now().toString(), name: 'Name', type: 'text' }
    ];

    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          user_id: user.id,
          name: newTableName,
          fields: JSON.stringify(defaultFields),
        })
        .select('id')
        .single();
        
      if (error) throw error;
      
      const newTable: Table = { id: data.id, name: newTableName, fields: defaultFields };
      setTables([...tables, newTable]);
      setSelectedTable(newTable);
      setNewTableName('');
    } catch (error) {
      console.error("Error creating table", error);
    } finally {
      setIsCreatingTable(false);
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

        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleCreateTable} className="flex gap-2">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="New Collection..."
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
            <button type="submit" disabled={isCreatingTable} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              <Plus className="w-4 h-4" />
            </button>
          </form>
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
                <div className="flex items-center gap-2">
                  {viewMode === 'data' && (
                    <button 
                      onClick={handleOpenAddRecord}
                      className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md transition flex items-center text-sm font-medium border border-blue-200"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Record
                    </button>
                  )}
                  <input
                    type="file"
                    accept=".json"
                    id={`import-json-${selectedTable.id}`}
                    className="hidden"
                    onChange={handleImportJson}
                  />
                  <button
                    onClick={() => document.getElementById(`import-json-${selectedTable.id}`)?.click()}
                    className="text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition flex items-center text-sm font-medium border"
                  >
                    <Upload className="w-4 h-4 mr-2" /> Import JSON
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
                     <div className="p-8 text-center text-gray-500">Loading records...</div>
                   ) : records.length === 0 ? (
                     <div className="p-8 text-center text-gray-500">No records found. Start adding data in your app!</div>
                   ) : (
                     <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-gray-50 border-b">
                         <tr>
                           <th className="px-6 py-3 font-semibold text-gray-600">ID</th>
                           <th className="px-6 py-3 font-semibold text-gray-600">Created At</th>
                           {selectedTable.fields.map(field => (
                             <th key={field.id} className="px-6 py-3 font-semibold text-gray-600">{field.name}</th>
                           ))}
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                         {records.map((record, index) => (
                           <tr key={`${record.id}-${index}`} className="hover:bg-gray-50/50">
                             <td className="px-6 py-4 font-mono text-xs text-gray-500">{record.id}</td>
                             <td className="px-6 py-4 text-gray-500">{new Date(record.created_at).toLocaleString()}</td>
                             {selectedTable.fields.map((field, i) => (
                               <td key={`cell-${record.id}-${field.id}-${i}`} className="px-6 py-4 truncate max-w-xs">{String(record[field.name] ?? '-')}</td>
                             ))}
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
    </div>
  );
}
