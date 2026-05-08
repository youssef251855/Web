'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader } from 'lucide-react';

export default function ResultLookupPage() {
  const [seatNumber, setSeatNumber] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // استبدل هذا بـ table_id الخاص بجدول ExamResults
  // يمكنك إيجاده من رابط جدول ExamResults في صفحة Database
  const EXAM_RESULTS_TABLE_ID = 'ضع_معرف_الجدول_هنا'; 

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seatNumber) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('records')
        .select('data')
        .eq('table_id', EXAM_RESULTS_TABLE_ID)
        .eq('data->>seat_number', seatNumber) // استعلام عن الحقل داخل JSONB
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setResult(data.data);
      } else {
        setError('عذراً، لم يتم العثور على نتيجة لهذا الرقم.');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6 text-center">استعلام عن النتيجة</h1>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <input
          type="text"
          value={seatNumber}
          onChange={(e) => setSeatNumber(e.target.value)}
          placeholder="أدخل رقم الجلوس"
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center hover:bg-blue-700 transition"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
          بحث
        </button>
      </form>

      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

      {result && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">بيانات النتيجة</h2>
          <div className="space-y-2">
            <p><strong>الاسم:</strong> {result.student_name}</p>
            <p><strong>النتيجة:</strong> {result.score}</p>
            <p><strong>الحالة:</strong> {result.status}</p>
          </div>
        </div>
      )}
    </div>
  );
}
