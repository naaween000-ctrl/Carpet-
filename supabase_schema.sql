-- SQL Schema for Taj Mahal Carpet Database in Supabase

-- 1. Create carpets table
CREATE TABLE IF NOT EXISTS public.carpets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    imageUrl TEXT,
    image_url TEXT,
    description TEXT,
    material TEXT,
    origin TEXT,
    knots TEXT,
    washing TEXT,
    face TEXT,
    sizes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY,
    settings_data JSONB,
    img_heritage TEXT,
    img_weaving TEXT,
    img_sustainable TEXT,
    img_factory1 TEXT,
    img_factory2 TEXT,
    img_factory3 TEXT,
    img_factory4 TEXT,
    contact_address TEXT,
    contact_phone1 TEXT,
    contact_phone2 TEXT,
    contact_email TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    interest TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) policies for anonymous access
ALTER TABLE public.carpets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (suitable for standard website backends with anon key)
CREATE POLICY "Allow public read access to carpets" ON public.carpets FOR SELECT USING (true);
CREATE POLICY "Allow public insert to carpets" ON public.carpets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to carpets" ON public.carpets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to carpets" ON public.carpets FOR DELETE USING (true);

CREATE POLICY "Allow public read access to site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public upsert to site_settings" ON public.site_settings FOR ALL USING (true);

CREATE POLICY "Allow public insert to messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public delete to messages" ON public.messages FOR DELETE USING (true);
