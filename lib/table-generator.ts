import { supabase } from './supabase';

export interface FieldDefinition {
  id?: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'relationship' | string;
  [key: string]: any;
}

const SAMPLE_NAMES = [
  'أحمد علي',
  'سارة محمد',
  'عمر خالد',
  'فاطمة إبراهيم',
  'يوسف حسام',
  'نور الهدى',
  'كريم محمود',
  'مريم عادل',
  'زياد طارق',
  'ليلى عبد الله'
];

const SAMPLE_EMAILS = [
  'ahmed.ali@example.com',
  'sara.m@example.com',
  'omar.k@example.com',
  'fatima.i@example.com',
  'youssef.h@example.com',
  'nour.h@example.com',
  'karim.m@example.com',
  'maryam.a@example.com'
];

const SAMPLE_PHONES = [
  '+20 100 123 4567',
  '+966 50 234 5678',
  '+971 50 345 6789',
  '+20 112 345 6789',
  '+965 99 123 456'
];

const SAMPLE_AVATARS = [
  'https://picsum.photos/seed/user1/200/200',
  'https://picsum.photos/seed/user2/200/200',
  'https://picsum.photos/seed/user3/200/200',
  'https://picsum.photos/seed/user4/200/200',
  'https://picsum.photos/seed/user5/200/200',
  'https://picsum.photos/seed/user6/200/200',
  'https://picsum.photos/seed/user7/200/200'
];

const SAMPLE_PRODUCTS = [
  { name: 'هاتف ذكي Pro Max', category: 'إلكترونيات', price: 1200, desc: 'شاشة OLED بدقة فائقة وبطارية تدوم طويلاً' },
  { name: 'سماعات رأس لاسلكية إلغاء الضوضاء', category: 'صوتيات', price: 250, desc: 'صوت محيطي نقي مع شحن فائق السرعة' },
  { name: 'ساعة يد رياضية ذكية', category: 'أجهزة ذكية', price: 180, desc: 'تتبع نبضات القلب والنشاط البدني ونظام GPS' },
  { name: 'حقيبة ظهر عصرية للكمبيوتر المحمول', category: 'إكسسوارات', price: 85, desc: 'مقاومة للماء وتصميم مريح للظهر' },
  { name: 'لوحة مفاتيح ميكانيكية RGB', category: 'ملحقات الحاسوب', price: 140, desc: 'مفاتيح سريعة الاستجابة وإضاءة ديناميكية' }
];

const SAMPLE_TASKS = [
  { title: 'تصميم الواجهة الرئيسية للتطبيق', priority: 'عالية (High)', status: 'قيد التنفيذ' },
  { title: 'ربط قاعدة البيانات ومزامنة السجلات', priority: 'عالية جداً (Urgent)', status: 'مكتمل' },
  { title: 'إعداد بوابات الدفع الإلكتروني', priority: 'متوسطة (Medium)', status: 'قيد الانتظار' },
  { title: 'اختبار تجربة المستخدم والتجاوب مع الموبايل', priority: 'عادية (Low)', status: 'قيد المراجعة' }
];

const SAMPLE_STATUSES = ['نشط (Active)', 'مكتمل (Completed)', 'قيد الانتظار (Pending)', 'مؤرشف (Archived)'];

/**
 * Generates a single mock record payload matching the provided fields and table context.
 */
export function generateMockRow(
  fields: FieldDefinition[],
  index: number = 0,
  tableName: string = ''
): Record<string, any> {
  const rowData: Record<string, any> = {};
  const normalizedTableName = (tableName || '').toLowerCase();

  fields.forEach((field) => {
    const rawName = field.name || 'field';
    const fieldName = rawName.toLowerCase();
    const fieldType = field.type || 'text';

    // 1. Check Field Type first
    if (fieldType === 'number') {
      if (fieldName.includes('price') || fieldName.includes('سعر') || fieldName.includes('cost') || fieldName.includes('مبلغ') || fieldName.includes('amount') || fieldName.includes('total') || fieldName.includes('إجمالي')) {
        rowData[rawName] = (index + 1) * 75 + 49;
      } else if (fieldName.includes('age') || fieldName.includes('عمر') || fieldName.includes('سن')) {
        rowData[rawName] = 22 + (index * 4) % 30;
      } else if (fieldName.includes('stock') || fieldName.includes('كمية') || fieldName.includes('qty') || fieldName.includes('count') || fieldName.includes('عدد')) {
        rowData[rawName] = 10 + index * 15;
      } else if (fieldName.includes('rating') || fieldName.includes('تقييم') || fieldName.includes('stars')) {
        rowData[rawName] = 4.5 + (index % 2 ? 0.3 : 0.5);
      } else {
        rowData[rawName] = (index + 1) * 10;
      }
      return;
    }

    if (fieldType === 'boolean') {
      rowData[rawName] = index % 2 === 0;
      return;
    }

    if (fieldType === 'date') {
      const d = new Date();
      d.setDate(d.getDate() - index * 2);
      rowData[rawName] = d.toISOString().split('T')[0];
      return;
    }

    // 2. Text fields - Match semantics based on name
    if (fieldName.includes('email') || fieldName.includes('بريد') || fieldName.includes('mail')) {
      rowData[rawName] = SAMPLE_EMAILS[index % SAMPLE_EMAILS.length];
    } else if (fieldName.includes('phone') || fieldName.includes('هاتف') || fieldName.includes('جوال') || fieldName.includes('mobile') || fieldName.includes('tel')) {
      rowData[rawName] = SAMPLE_PHONES[index % SAMPLE_PHONES.length];
    } else if (fieldName.includes('avatar') || fieldName.includes('photo') || fieldName.includes('صورة') || fieldName.includes('image') || fieldName.includes('img') || fieldName.includes('pic')) {
      rowData[rawName] = `https://picsum.photos/seed/item_${index + 1}/300/300`;
    } else if (fieldName.includes('status') || fieldName.includes('حالة') || fieldName.includes('state')) {
      rowData[rawName] = SAMPLE_STATUSES[index % SAMPLE_STATUSES.length];
    } else if (fieldName.includes('title') || fieldName.includes('عنوان') || fieldName.includes('موضوع') || fieldName.includes('subject')) {
      if (normalizedTableName.includes('task') || normalizedTableName.includes('مهم') || normalizedTableName.includes('مشروع')) {
        rowData[rawName] = SAMPLE_TASKS[index % SAMPLE_TASKS.length].title;
      } else if (normalizedTableName.includes('product') || normalizedTableName.includes('منتج') || normalizedTableName.includes('متجر')) {
        rowData[rawName] = SAMPLE_PRODUCTS[index % SAMPLE_PRODUCTS.length].name;
      } else {
        rowData[rawName] = `عنصر تجريبي رقم #${index + 1}`;
      }
    } else if (fieldName.includes('priority') || fieldName.includes('أولوية')) {
      rowData[rawName] = SAMPLE_TASKS[index % SAMPLE_TASKS.length].priority;
    } else if (fieldName.includes('category') || fieldName.includes('تصنيف') || fieldName.includes('قسم')) {
      rowData[rawName] = ['عام', 'إلكترونيات', 'خدمات', 'أعمال', 'تسويق'][index % 5];
    } else if (fieldName.includes('message') || fieldName.includes('رسالة') || fieldName.includes('comment') || fieldName.includes('تعليق') || fieldName.includes('desc') || fieldName.includes('وصف')) {
      rowData[rawName] = `هذا نص تجريبي تلقائي تم توليده لاختبار الحقل "${rawName}" بنجاح وتوفير معاينة حية للمشروع.`;
    } else if (fieldName.includes('name') || fieldName.includes('اسم') || fieldName.includes('author') || fieldName.includes('sender') || fieldName.includes('user') || fieldName.includes('مستخدم') || fieldName.includes('عميل')) {
      if (normalizedTableName.includes('product') || normalizedTableName.includes('منتج') || normalizedTableName.includes('item') || normalizedTableName.includes('سلعة')) {
        rowData[rawName] = SAMPLE_PRODUCTS[index % SAMPLE_PRODUCTS.length].name;
      } else {
        rowData[rawName] = SAMPLE_NAMES[index % SAMPLE_NAMES.length];
      }
    } else if (fieldName.includes('address') || fieldName.includes('عنوان_السكن') || fieldName.includes('city') || fieldName.includes('مدينة') || fieldName.includes('country') || fieldName.includes('دولة')) {
      rowData[rawName] = ['القاهرة، مصر', 'الرياض، السعودية', 'دبي، الإمارات', 'الدوحة، قطر', 'الكويت'][index % 5];
    } else {
      // General Fallback
      rowData[rawName] = `قيمة تجريبية (${rawName} ${index + 1})`;
    }
  });

  return rowData;
}

/**
 * Generates an array of mock rows for given fields.
 */
export function generateMockRows(
  fields: FieldDefinition[],
  count: number = 3,
  tableName: string = ''
): Array<Record<string, any>> {
  const rows: Array<Record<string, any>> = [];
  for (let i = 0; i < count; i++) {
    rows.push(generateMockRow(fields, i, tableName));
  }
  return rows;
}

/**
 * Automatically creates and persists initial sample records for a table into Supabase/Appwrite database.
 */
export async function autoSeedTableRows(
  tableId: string,
  userId: string,
  tableName: string,
  fields: FieldDefinition[],
  count: number = 3
): Promise<{ success: boolean; inserted: any[]; error?: any }> {
  try {
    if (!tableId || !userId || !fields || fields.length === 0) {
      return { success: false, inserted: [] };
    }

    const mockRows = generateMockRows(fields, count, tableName);
    const recordsToInsert = mockRows.map((data) => ({
      table_id: tableId,
      user_id: userId,
      data: JSON.stringify(data),
    }));

    const { data, error } = await supabase
      .from('records')
      .insert(recordsToInsert)
      .select('*');

    if (error) {
      console.error('Error auto-seeding table records:', error);
      return { success: false, inserted: [], error };
    }

    const parsedRecords = (data || []).map((record: any, index: number) => ({
      id: record.id,
      created_at: record.created_at || new Date().toISOString(),
      ...(typeof record.data === 'string' ? JSON.parse(record.data) : record.data || mockRows[index] || {})
    }));

    return { success: true, inserted: parsedRecords };
  } catch (err) {
    console.error('Auto seed execution exception:', err);
    return { success: false, inserted: [], error: err };
  }
}
