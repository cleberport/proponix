
-- Create storage bucket for template images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('template-images', 'template-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload template images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'template-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own template images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'template-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own template images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'template-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public read access
CREATE POLICY "Public read access for template images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'template-images');
