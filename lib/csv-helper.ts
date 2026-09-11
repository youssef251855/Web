/**
 * Comprehensive CSV Helper for Import, Export, Template Generation, and Appwrite CSV support with Arabic & UTF-8.
 */

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  error?: string;
}

export interface AppwritePreset {
  id: string;
  name: string;
  description: string;
  collectionId: string;
  filename: string;
  headers: string[];
  rows: Record<string, any>[];
}

export const APPWRITE_PRESETS: AppwritePreset[] = [
  {
    id: 'users',
    name: 'مستخدمين Appwrite (Users Collection)',
    description: 'جدول المستخدمين المتوافق مع Appwrite Auth & Users Database',
    collectionId: 'users',
    filename: 'appwrite_users_collection.csv',
    headers: ['$id', '$createdAt', '$updatedAt', '$permissions', 'name', 'email', 'phone', 'role', 'status', 'avatarUrl'],
    rows: [
      {
        '$id': 'usr_66e01a9b2c3d4e5f',
        '$createdAt': '2026-09-01T10:00:00.000Z',
        '$updatedAt': '2026-09-08T12:30:00.000Z',
        '$permissions': '["read(\\"any\\")","write(\\"users\\")"]',
        'name': 'أحمد محمود',
        'email': 'ahmed.mahmoud@example.com',
        'phone': '+201001234567',
        'role': 'admin',
        'status': 'active',
        'avatarUrl': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      },
      {
        '$id': 'usr_66e02b8a3d4e5f6a',
        '$createdAt': '2026-09-02T14:15:00.000Z',
        '$updatedAt': '2026-09-07T09:20:00.000Z',
        '$permissions': '["read(\\"any\\")","write(\\"users\\")"]',
        'name': 'سارة خالد',
        'email': 'sara.khaled@example.com',
        'phone': '+966501234567',
        'role': 'editor',
        'status': 'active',
        'avatarUrl': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      {
        '$id': 'usr_66e03c7d4e5f6a7b',
        '$createdAt': '2026-09-05T08:45:00.000Z',
        '$updatedAt': '2026-09-09T06:00:00.000Z',
        '$permissions': '["read(\\"any\\")","write(\\"users\\")"]',
        'name': 'يوسف علي',
        'email': 'youssef.ali@example.com',
        'phone': '+201123456789',
        'role': 'user',
        'status': 'active',
        'avatarUrl': 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'
      }
    ]
  },
  {
    id: 'posts',
    name: 'مقالات ومنشورات (Posts Collection)',
    description: 'جدول المقالات والمدونة المتوافق مع Appwrite Documents',
    collectionId: 'posts',
    filename: 'appwrite_posts_collection.csv',
    headers: ['$id', '$createdAt', '$updatedAt', '$permissions', 'title', 'slug', 'content', 'authorId', 'category', 'views', 'published'],
    rows: [
      {
        '$id': 'doc_post_66e111a',
        '$createdAt': '2026-09-03T11:00:00.000Z',
        '$updatedAt': '2026-09-08T15:00:00.000Z',
        '$permissions': '["read(\\"any\\")"]',
        'title': 'مستقبل تطبيقات الويب وتطوير الـ No-Code',
        'slug': 'future-of-web-and-no-code',
        'content': 'مقال تحليلي يستعرض ثورة أدوات التطوير السريع وقواعد البيانات السحابية الحديثة.',
        'authorId': 'usr_66e01a9b2c3d4e5f',
        'category': 'Technology',
        'views': 1240,
        'published': true
      },
      {
        '$id': 'doc_post_66e222b',
        '$createdAt': '2026-09-06T16:30:00.000Z',
        '$updatedAt': '2026-09-09T05:30:00.000Z',
        '$permissions': '["read(\\"any\\")"]',
        'title': 'دليل ربط قواعد بيانات Appwrite بتطبيقاتك',
        'slug': 'guide-to-appwrite-databases',
        'content': 'شرح خطوة بخطوة لكيفية استيراد الجداول وإدارة الصلاحيات والمستندات بمرونة.',
        'authorId': 'usr_66e02b8a3d4e5f6a',
        'category': 'Tutorial',
        'views': 890,
        'published': true
      }
    ]
  },
  {
    id: 'products',
    name: 'منتجات وتجارة إلكترونية (Products Collection)',
    description: 'جدول المنتجات والكتالوج لـ Appwrite Database',
    collectionId: 'products',
    filename: 'appwrite_products_collection.csv',
    headers: ['$id', '$createdAt', '$updatedAt', '$permissions', 'name', 'sku', 'price', 'discountPrice', 'stock', 'category', 'imageUrl', 'inStock'],
    rows: [
      {
        '$id': 'prd_66f0111a',
        '$createdAt': '2026-09-01T09:00:00.000Z',
        '$updatedAt': '2026-09-09T04:00:00.000Z',
        '$permissions': '["read(\\"any\\")"]',
        'name': 'سماعات رأس لاسلكية احترافية',
        'sku': 'HEADPHONE-PRO-01',
        'price': 149.99,
        'discountPrice': 119.99,
        'stock': 45,
        'category': 'Electronics',
        'imageUrl': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300',
        'inStock': true
      },
      {
        '$id': 'prd_66f0222b',
        '$createdAt': '2026-09-02T10:30:00.000Z',
        '$updatedAt': '2026-09-08T18:00:00.000Z',
        '$permissions': '["read(\\"any\\")"]',
        'name': 'ساعة ذكية مقاومة للماء',
        'sku': 'SMARTWATCH-SPORT',
        'price': 199.50,
        'discountPrice': 175.00,
        'stock': 28,
        'category': 'Accessories',
        'imageUrl': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
        'inStock': true
      }
    ]
  },
  {
    id: 'tasks',
    name: 'مهام ومشاريع (Tasks & Projects Collection)',
    description: 'جدول إدارة المهام والمشاريع لـ Appwrite',
    collectionId: 'tasks',
    filename: 'appwrite_tasks_collection.csv',
    headers: ['$id', '$createdAt', '$updatedAt', '$permissions', 'title', 'description', 'priority', 'status', 'assignedTo', 'dueDate'],
    rows: [
      {
        '$id': 'tsk_66c0111a',
        '$createdAt': '2026-09-04T08:00:00.000Z',
        '$updatedAt': '2026-09-09T05:00:00.000Z',
        '$permissions': '["read(\\"users\\")","write(\\"users\\")"]',
        'title': 'تصميم واجهة المستخدم الجديدة',
        'description': 'إعداد الشاشات واللوحات الرئيسية المتجاوبة مع كافة الشاشات',
        'priority': 'high',
        'status': 'in_progress',
        'assignedTo': 'usr_66e01a9b2c3d4e5f',
        'dueDate': '2026-09-15'
      },
      {
        '$id': 'tsk_66c0222b',
        '$createdAt': '2026-09-05T09:30:00.000Z',
        '$updatedAt': '2026-09-08T16:00:00.000Z',
        '$permissions': '["read(\\"users\\")","write(\\"users\\")"]',
        'title': 'تكامل ملفات CSV و Appwrite Database',
        'description': 'توفير التصدير والاستيراد المتوافق مع معايير Appwrite',
        'priority': 'urgent',
        'status': 'completed',
        'assignedTo': 'usr_66e02b8a3d4e5f6a',
        'dueDate': '2026-09-10'
      }
    ]
  }
];

/**
 * Escapes and formats a single cell value for CSV output.
 */
function escapeCSVValue(val: any): string {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  const str = String(val);
  // If contains comma, quotes, or newlines, escape internal quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports an array of records matching fields to a downloadable standard CSV file.
 */
export function exportRecordsToCSV(
  tableName: string,
  fields: Array<{ name: string; [key: string]: any }>,
  records: Array<Record<string, any>>
): boolean {
  try {
    const fieldNames = fields.map(f => f.name);
    
    // Headers: id, created_at, ...fieldNames
    const headers = ['id', 'created_at', ...fieldNames];
    const headerRow = headers.map(h => escapeCSVValue(h)).join(',');

    // Build data rows
    const dataRows = records.map((record) => {
      const rowValues = [
        escapeCSVValue(record.id || ''),
        escapeCSVValue(record.created_at || new Date().toISOString()),
        ...fieldNames.map(fName => escapeCSVValue(record[fName] !== undefined ? record[fName] : ''))
      ];
      return rowValues.join(',');
    });

    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    const cleanName = (tableName || 'table_data').toLowerCase().replace(/\s+/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `${cleanName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return false;
  }
}

/**
 * Exports current table records formatted specifically for Appwrite Collections / Documents.
 * Appwrite standards: $id, $createdAt, $updatedAt, $permissions, [attributes...]
 */
export function exportRecordsToAppwriteCSV(
  tableName: string,
  fields: Array<{ name: string; [key: string]: any }>,
  records: Array<Record<string, any>>
): boolean {
  try {
    const customFieldNames = fields
      .map(f => f.name)
      .filter(f => !f.startsWith('$') && f !== 'id' && f !== 'created_at' && f !== 'updated_at');

    const appwriteHeaders = ['$id', '$createdAt', '$updatedAt', '$permissions', ...customFieldNames];
    const headerRow = appwriteHeaders.map(h => escapeCSVValue(h)).join(',');

    const dataRows = records.map((record, index) => {
      const docId = record.$id || record.id || `appwrite_doc_${Date.now()}_${index}`;
      const createdAt = record.$createdAt || record.created_at || new Date().toISOString();
      const updatedAt = record.$updatedAt || record.updated_at || new Date().toISOString();
      const permissions = record.$permissions || '["read(\\"any\\")","write(\\"users\\")"]';

      const rowValues = [
        escapeCSVValue(docId),
        escapeCSVValue(createdAt),
        escapeCSVValue(updatedAt),
        escapeCSVValue(permissions),
        ...customFieldNames.map(fName => escapeCSVValue(record[fName] !== undefined ? record[fName] : ''))
      ];
      return rowValues.join(',');
    });

    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const cleanName = (tableName || 'appwrite_collection').toLowerCase().replace(/\s+/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `appwrite_${cleanName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export Appwrite CSV:', error);
    return false;
  }
}

/**
 * Downloads a preset Appwrite Collection CSV file (Users, Posts, Products, Tasks).
 */
export function downloadAppwritePresetCSV(presetId: string): boolean {
  try {
    const preset = APPWRITE_PRESETS.find(p => p.id === presetId) || APPWRITE_PRESETS[0];
    const headerRow = preset.headers.map(h => escapeCSVValue(h)).join(',');

    const dataRows = preset.rows.map(row => {
      return preset.headers.map(h => escapeCSVValue(row[h] !== undefined ? row[h] : '')).join(',');
    });

    const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', preset.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to download Appwrite Preset CSV:', error);
    return false;
  }
}

/**
 * Generates and downloads a blank template CSV file with headers for the given table fields.
 */
export function downloadSampleCSVTemplate(
  tableName: string,
  fields: Array<{ name: string; type?: string; [key: string]: any }>
): boolean {
  try {
    const fieldNames = fields.map(f => f.name);
    const headerRow = fieldNames.map(h => escapeCSVValue(h)).join(',');

    // Create 2 sample illustrative rows
    const sampleRow1 = fieldNames.map(f => escapeCSVValue(`عينة ${f} 1`)).join(',');
    const sampleRow2 = fieldNames.map(f => escapeCSVValue(`عينة ${f} 2`)).join(',');

    const csvContent = '\uFEFF' + [headerRow, sampleRow1, sampleRow2].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    const cleanName = (tableName || 'template').toLowerCase().replace(/\s+/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `${cleanName}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to download CSV template:', error);
    return false;
  }
}

/**
 * Robust CSV parser that handles quotes, escaped quotes, multiline cells, commas, semicolons, and tabs.
 */
export function parseCSVText(csvText: string): CSVParseResult {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [], totalRows: 0, error: 'الملف فارغ' };
  }

  // Remove BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '').trim();

  // Detect delimiter: comma, semicolon or tab
  const firstLine = cleanText.split(/\r\n|\n|\r/)[0];
  let delimiter = ',';
  if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = '\t';
  }

  const rawLines = parseCSVIntoMatrix(cleanText, delimiter);
  if (rawLines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, error: 'تعذر قراءة أسطر البيانات في الملف' };
  }

  const headers = rawLines[0].map(h => h.trim()).filter(h => h.length > 0);
  if (headers.length === 0) {
    return { headers: [], rows: [], totalRows: 0, error: 'لم يتم العثور على عناوين أعمدة صالحة' };
  }

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const rowValues = rawLines[i];
    // Skip empty lines
    if (rowValues.length === 0 || (rowValues.length === 1 && !rowValues[0].trim())) {
      continue;
    }

    const rowObj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let val: any = rowValues[index] !== undefined ? rowValues[index].trim() : '';
      
      // Auto-cast numbers and booleans if straightforward
      if (/^-?\d+(\.\d+)?$/.test(val)) {
        val = Number(val);
      } else if (val.toLowerCase() === 'true') {
        val = true;
      } else if (val.toLowerCase() === 'false') {
        val = false;
      }
      
      rowObj[header] = val;
    });

    rows.push(rowObj);
  }

  return {
    headers,
    rows,
    totalRows: rows.length
  };
}

export interface FirebasePreset {
  id: string;
  name: string;
  description: string;
  collection: string;
  collectionId?: string;
  filename: string;
  data: Record<string, any>[];
}

export const FIREBASE_PRESETS: FirebasePreset[] = [
  {
    id: 'users',
    name: 'مستخدمين Firebase (Users Collection)',
    description: 'مجموعة مستخدمي Firestore المتوافقة مع Firebase Auth',
    collection: 'users',
    filename: 'firebase_users_collection.json',
    data: [
      {
        id: 'usr_firebase_admin_01',
        name: 'أحمد محمود',
        username: 'ahmed_m',
        email: 'ahmed.mahmoud@example.com',
        role: 'admin',
        createdAt: '2026-09-01T10:00:00.000Z',
      },
      {
        id: 'usr_firebase_editor_02',
        name: 'سارة خالد',
        username: 'sara_k',
        email: 'sara.khaled@example.com',
        role: 'editor',
        createdAt: '2026-09-02T14:15:00.000Z',
      }
    ]
  },
  {
    id: 'pages',
    name: 'صفحات ومواقع Firebase (Pages Collection)',
    description: 'مجموعة صفحات المنشئ والمواقع التفاعلية',
    collection: 'pages',
    filename: 'firebase_pages_collection.json',
    data: [
      {
        id: 'page_home_01',
        name: 'الصفحة الرئيسية',
        slug: 'home',
        content: JSON.stringify({ title: 'مرحبا بكم في تطبيقنا' }),
        published: true,
        createdAt: '2026-09-03T11:00:00.000Z',
      }
    ]
  },
  {
    id: 'records',
    name: 'سجلات الجداول (Records Collection)',
    description: 'سجلات وحقول البيانات الديناميكية في Firestore',
    collection: 'records',
    filename: 'firebase_records_collection.json',
    data: [
      {
        id: 'rec_prod_01',
        title: 'هاتف ذكي برو',
        price: 1200,
        category: 'إلكترونيات',
        stock: 25,
        createdAt: '2026-09-04T08:00:00.000Z',
      }
    ]
  }
];

export function downloadFirebasePreset(presetId: string, format: 'json' | 'csv' = 'json'): boolean {
  try {
    const preset = FIREBASE_PRESETS.find(p => p.id === presetId) || FIREBASE_PRESETS[0];
    if (format === 'csv') {
      const sample = preset.data[0] || {};
      const fields = Object.keys(sample).map(key => ({ name: key, type: typeof sample[key] }));
      return exportRecordsToCSV(preset.name, fields, preset.data);
    }

    const jsonStr = JSON.stringify(preset.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', preset.filename || `firebase_${preset.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to download Firebase preset:', error);
    return false;
  }
}

export const downloadFirebaseJSON = downloadFirebasePreset;

export function exportRecordsToFirebaseJSON(tableName: string, records: Array<Record<string, any>>): boolean {
  try {
    const jsonStr = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanName = (tableName || 'firestore_collection').toLowerCase().replace(/\s+/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `firebase_${cleanName}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export Firebase JSON:', error);
    return false;
  }
}

/**
 * Character-by-character CSV tokenizer supporting quotes and commas.
 */
function parseCSVIntoMatrix(text: string, delimiter: string = ','): string[][] {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in CRLF
      }
      currentRow.push(currentCell);
      result.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    result.push(currentRow);
  }

  return result;
}

