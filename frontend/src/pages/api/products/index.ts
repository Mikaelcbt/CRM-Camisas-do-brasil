import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const skip = Number(req.query.skip ?? 0);
    const limit = Math.min(Number(req.query.limit ?? 100), 200);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .range(skip, skip + limit - 1);
    if (error) return res.status(500).json({ detail: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('products')
      .insert(req.body)
      .select()
      .single();
    if (error) return res.status(400).json({ detail: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
