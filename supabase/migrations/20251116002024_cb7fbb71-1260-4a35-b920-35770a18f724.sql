-- Create storage bucket for replay artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES ('replays', 'replays', false);

-- RLS policies for replay storage
CREATE POLICY "Replays are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'replays');

CREATE POLICY "Service role can upload replays"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'replays');

CREATE POLICY "Service role can update replays"
ON storage.objects FOR UPDATE
USING (bucket_id = 'replays');

CREATE POLICY "Service role can delete old replays"
ON storage.objects FOR DELETE
USING (bucket_id = 'replays');