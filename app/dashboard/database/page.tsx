'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Save, Database as DbIcon, Type, Hash, Calendar, Settings, ListPlus, LayoutList } from 'lucide-react';

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

  useEffect(() => {
    const fetchTables = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'tables'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const fetchedTables: Table[] = [];
        snap.forEach(d => {
          fetchedTables.push({
            id: d.id,
            name: d.data().name,
            fields: JSON.parse(d.data().fields),
          });
        });
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

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTableName.trim()) return;
    setIsCreatingTable(true);
    
    // Auto-create an 'id' and 'name' field by default
    const defaultFields: Field[] = [
      { id: Date.now().toString(), name: 'Name', type: 'text' }
    ];

    try {
      const docRef = await addDoc(collection(db, 'tables'), {
        userId: user.uid,
        name: newTableName,
        fields: JSON.stringify(defaultFields),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      const newTable: Table = { id: docRef.id, name: newTableName, fields: defaultFields };
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
      await updateDoc(doc(db, 'tables', selectedTable.id), {
        fields: JSON.stringify(updatedFields),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating table", error);
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable || !confirm('Are you sure you want to delete this table? All data will be lost.')) return;
    try {
      await deleteDoc(doc(db, 'tables', selectedTable.id));
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
            <div className="bg-white border-b px-8 py-6 flex justify-between items-center shrink-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedTable.name} Schema</h1>
                <p className="text-sm text-gray-500 mt-1">Define the fields and data types for this collection.</p>
              </div>
              <button 
                onClick={handleDeleteTable}
                className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-md transition flex items-center text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Collection
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="w-1/2">Property Name</div>
                  <div className="w-1/3">Property Type</div>
                  <div className="w-1/6 text-right">Actions</div>
                </div>
                
                <div className="divide-y">
                  {selectedTable.fields.map(field => (
                    <div key={field.id} className="p-6 flex items-start gap-6 hover:bg-gray-50/50 transition">
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
