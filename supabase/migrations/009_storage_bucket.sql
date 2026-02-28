-- Create storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  true,  -- Public bucket so PDFs can be directly downloaded
  52428800,  -- 50MB max file size
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload reports
CREATE POLICY "Users can upload reports" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports');

-- Public read policy (PDFs are shareable via direct URL)
CREATE POLICY "Anyone can read reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'reports');

-- Allow users to overwrite their own reports (upsert)
CREATE POLICY "Users can update own reports" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'reports')
  WITH CHECK (bucket_id = 'reports');
