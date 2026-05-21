-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migrate existing columns from camelCase to snake_case if they exist
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='users' and column_name='uid') THEN
      ALTER TABLE public.users RENAME COLUMN "uid" TO id;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='pages' and column_name='userId') THEN
      ALTER TABLE public.pages RENAME COLUMN "userId" TO user_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='pages' and column_name='userid') THEN
      ALTER TABLE public.pages RENAME COLUMN userid TO user_id;
  END IF;
  
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='pages' and column_name='createdAt') THEN
      ALTER TABLE public.pages RENAME COLUMN "createdAt" TO created_at;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='pages' and column_name='createdat') THEN
      ALTER TABLE public.pages RENAME COLUMN createdat TO created_at;
  END IF;
  
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tables' and column_name='userId') THEN
      ALTER TABLE public.tables RENAME COLUMN "userId" TO user_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tables' and column_name='userid') THEN
      ALTER TABLE public.tables RENAME COLUMN userid TO user_id;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='records' and column_name='userId') THEN
      ALTER TABLE public.records RENAME COLUMN "userId" TO user_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='records' and column_name='userid') THEN
      ALTER TABLE public.records RENAME COLUMN userid TO user_id;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='records' and column_name='tableId') THEN
      ALTER TABLE public.records RENAME COLUMN "tableId" TO table_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='records' and column_name='tableid') THEN
      ALTER TABLE public.records RENAME COLUMN tableid TO table_id;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='records' and column_name='createdAt') THEN
      ALTER TABLE public.records RENAME COLUMN "createdAt" TO created_at;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='records' and column_name='createdat') THEN
      ALTER TABLE public.records RENAME COLUMN createdat TO created_at;
  END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' and column_name='userId') THEN
      ALTER TABLE public.user_settings RENAME COLUMN "userId" TO user_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='user_settings' and column_name='userid') THEN
      ALTER TABLE public.user_settings RENAME COLUMN userid TO user_id;
  END IF;
  
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='site_users' and column_name='ownerId') THEN
      ALTER TABLE public.site_users RENAME COLUMN "ownerId" TO owner_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='site_users' and column_name='ownerid') THEN
      ALTER TABLE public.site_users RENAME COLUMN ownerid TO owner_id;
  END IF;
  
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='files' and column_name='userId') THEN
      ALTER TABLE public.files RENAME COLUMN "userId" TO user_id;
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='files' and column_name='userid') THEN
      ALTER TABLE public.files RENAME COLUMN userid TO user_id;
  END IF;

  -- Ensure columns exist in case tables were created with an older schema
  ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
  
  ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  
  ALTER TABLE public.records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE public.records ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE;
  
  ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;
  
  ALTER TABLE public.site_users ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE public.site_users ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE public.site_users ADD COLUMN IF NOT EXISTS role TEXT;
  
  ALTER TABLE public.files ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Pages Table
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    slug TEXT,
    description TEXT,
    content JSONB,
    custom_domain TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tables (Schema Configurations) Table
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    fields JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Records (App Data) Table
CREATE TABLE IF NOT EXISTS public.records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Files Table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Site Users Table (Users registered on created apps)
CREATE TABLE IF NOT EXISTS public.site_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    password TEXT,
    name TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_users ENABLE ROW LEVEL SECURITY;

-- 🛡️ Security Policies

-- users: Anyone can view users, Users can update their own records
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
CREATE POLICY "Anyone can view users" 
    ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" 
    ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" 
    ON public.users FOR UPDATE USING (auth.uid() = id);

-- pages: Users can perform all actions on their own pages. Everyone can read pages.
DROP POLICY IF EXISTS "Anyone can view pages" ON public.pages;
CREATE POLICY "Anyone can view pages" 
    ON public.pages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own pages" ON public.pages;
CREATE POLICY "Users can insert their own pages" 
    ON public.pages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pages" ON public.pages;
CREATE POLICY "Users can update their own pages" 
    ON public.pages FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pages" ON public.pages;
CREATE POLICY "Users can delete their own pages" 
    ON public.pages FOR DELETE USING (auth.uid() = user_id);

-- tables: Users can perform all actions on their own table schemas
DROP POLICY IF EXISTS "Users can view their own tables" ON public.tables;
CREATE POLICY "Users can view their own tables" 
    ON public.tables FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tables" ON public.tables;
CREATE POLICY "Users can insert their own tables" 
    ON public.tables FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tables" ON public.tables;
CREATE POLICY "Users can update their own tables" 
    ON public.tables FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tables" ON public.tables;
CREATE POLICY "Users can delete their own tables" 
    ON public.tables FOR DELETE USING (auth.uid() = user_id);

-- records: Users can perform all actions on their own data records. (You might open SELECT for apps)
DROP POLICY IF EXISTS "Anyone can view data records" ON public.records;
CREATE POLICY "Anyone can view data records" 
    ON public.records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own records" ON public.records;
CREATE POLICY "Users can insert their own records" 
    ON public.records FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own records" ON public.records;
CREATE POLICY "Users can update their own records" 
    ON public.records FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own records" ON public.records;
CREATE POLICY "Users can delete their own records" 
    ON public.records FOR DELETE USING (auth.uid() = user_id);

-- user_settings: Users can perform all actions on their own settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings" 
    ON public.user_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
CREATE POLICY "Users can insert their own settings" 
    ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings" 
    ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
CREATE POLICY "Users can delete their own settings" 
    ON public.user_settings FOR DELETE USING (auth.uid() = user_id);

-- files: Users can perform all actions on their own files
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
CREATE POLICY "Users can view their own files" 
    ON public.files FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
DROP POLICY IF EXISTS "Anyone can insert files" ON public.files;
CREATE POLICY "Anyone can insert files" 
    ON public.files FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
CREATE POLICY "Users can delete their own files" 
    ON public.files FOR DELETE USING (auth.uid() = user_id);

-- site_users: Users can manage users for their own apps, and read operations can happen during auth
DROP POLICY IF EXISTS "Anyone can view site_users" ON public.site_users;
CREATE POLICY "Anyone can view site_users" 
    ON public.site_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert site_users" ON public.site_users;
CREATE POLICY "Anyone can insert site_users" 
    ON public.site_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their apps site_users" ON public.site_users;
CREATE POLICY "Users can update their apps site_users" 
    ON public.site_users FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their apps site_users" ON public.site_users;
CREATE POLICY "Users can delete their apps site_users" 
    ON public.site_users FOR DELETE USING (auth.uid() = owner_id);

-- 🟢 Enable Realtime for all tables (To make it work like Firebase Realtime Database)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_users;

-- Reload the PostgREST schema cache to ensure the API sees the newly created tables immediately
NOTIFY pgrst, 'reload schema';

-- Create a storage bucket for uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT USING (bucket_id = 'files');

DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
CREATE POLICY "Anyone can upload" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'files');

DROP POLICY IF EXISTS "Anyone can update" ON storage.objects;
CREATE POLICY "Anyone can update" 
ON storage.objects FOR UPDATE USING (bucket_id = 'files');

DROP POLICY IF EXISTS "Anyone can delete" ON storage.objects;
CREATE POLICY "Anyone can delete" 
ON storage.objects FOR DELETE USING (bucket_id = 'files');
