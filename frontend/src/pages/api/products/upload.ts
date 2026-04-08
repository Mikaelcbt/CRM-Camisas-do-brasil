import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

const BUCKET = 'product-images';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const { filename, data: base64Data, type } = req.body as {
    filename?: string;
    data?: string;
    type?: string;
  };

  if (!filename || !base64Data || !type) {
    return res.status(400).json({ detail: 'filename, data, and type are required' });
  }

  if (!ALLOWED_TYPES.has(type)) {
    return res.status(400).json({ detail: 'Only JPEG, PNG, WebP, and GIF images are allowed' });
  }

  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.byteLength > MAX_SIZE_BYTES) {
    return res.status(400).json({ detail: 'Image must be smaller than 5 MB' });
  }

  // Create bucket if it doesn't exist
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {
    // Bucket already exists — that's fine
  });

  const ext = filename.split('.').pop() ?? 'jpg';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(uniqueName, buffer, { contentType: type, upsert: false });

  if (uploadError) {
    return res.status(500).json({ detail: `Upload failed: ${uploadError.message}` });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName);

  return res.status(200).json({ url: publicUrl });
}
