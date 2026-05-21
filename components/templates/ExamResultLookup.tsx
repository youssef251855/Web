'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader, BookOpen, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';

type Result = Record<string, any>;

export default function ExamResultLookup({ tableId }: { tableId: string }) {
  const [seatNumber, setSeatNumber] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableId);

    if (!tableId || !isValidUuid) {
      setLoading(false);
      setError('⚠️ لا يوجد جدول بيانات مرتبطة ببحث النتائج هذا. يرجى تفعيل "توصيل قاعدة البيانات" (Database Connection) واختيار جدول صحيح من الخصائص الجانبية للمكون.');
      return;
    }

    try {
      const searchTerm = seatNumber.trim();
      let foundData = null;

      // Try exact match with expected 'seat_number' key
      let { data, error } = await supabase
        .from('records')
        .select('data')
        .eq('table_id', tableId)
        .eq('data->>seat_number', searchTerm)
        .maybeSingle();

      if (data) {
        foundData = data.data;
      } else {
        // Fallback: Fetch all and search inside JSON values to handle Arabic keys / custom JSON schemas
        const { data: allData } = await supabase
          .from('records')
          .select('data')
          .eq('table_id', tableId);

        if (allData) {
          const matchedRecord = allData.find(r => {
            const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
            return Object.values(d).some(val => String(val).trim() === searchTerm);
          });
          if (matchedRecord) {
             foundData = typeof matchedRecord.data === 'string' ? JSON.parse(matchedRecord.data) : matchedRecord.data;
          }
        }
      }

      if (error && !foundData) throw error;
      
      if (foundData) {
        setResult(typeof foundData === 'string' ? JSON.parse(foundData) : foundData);
      } else {
        setError('عذراً، لم يتم العثور على نتيجة لهذا الرقم. يرجى التأكد من صحة رقم الجلوس أو رقم البحث.');
      }
    } catch (err: any) {
      console.error(err);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('uuid') || msg.includes('syntax') || msg.includes('cast')) {
        setError('⚠️ تنسيق معرف الجدول غير صالح أو تم حذفه. يرجى اختيار جدول صحيح من قسم الاتصال بقاعدة البيانات في قائمة الخصائص.');
      } else {
        setError('⚠️ حدث خطأ أثناء الاتصال بقاعدة البيانات: ' + (err?.message || 'يرجى المحاولة لاحقاً.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 mb-8">
          <div className="relative">
            <input
              type="text"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="أدخل رقم الجلوس (مثلاً: 12345)"
              className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              required
            />
            <Search className="absolute left-4 top-4 text-zinc-400 w-5 h-5" />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-zinc-900 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center hover:bg-zinc-800 transition disabled:opacity-70"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : 'عرض النتيجة'}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-lg border border-zinc-200 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-zinc-900 p-6 text-white text-center">
              <GraduationCap className="w-12 h-12 mx-auto mb-2 text-blue-400" />
              <h2 className="text-xl font-bold">
                {result.student_name || result['الاسم'] || result['اسم الطالب'] || result['Name'] || Object.values(result)[0]}
              </h2>
              <p className="text-zinc-400">رقم الجلوس: {seatNumber}</p>
            </div>
            
            <div className="p-6 space-y-4">
              {Object.entries(result).filter(([k]) => {
                 const keyLow = k.toLowerCase();
                 return !['student_name', 'الاسم', 'اسم الطالب', 'name'].includes(keyLow) &&
                        !['seat_number', 'رقم الجلوس', 'seatnumber', 'seat number'].includes(keyLow);
              }).map(([key, val]) => {
                let badgeClass = "text-zinc-900";
                let highlight = false;
                if (key.includes('حالة') || key.includes('status') || key.includes('نتيجة')) {
                   highlight = true;
                   badgeClass = String(val).includes('ناجح') || String(val).includes('pass') ? 'bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm' :
                               (String(val).includes('راسب') || String(val).includes('fail') ? 'bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-sm' : 'font-bold text-zinc-900');
                }
                
                return (
                  <div key={key} className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
                    <span className="text-zinc-500 font-medium">{key}</span>
                    <span className={highlight ? badgeClass : "font-bold text-lg text-zinc-900"}>{String(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
