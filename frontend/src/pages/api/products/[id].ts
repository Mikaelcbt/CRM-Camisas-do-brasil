import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return res.status(500).json({ detail: error.message });
    if (!data) return res.status(404).json({ detail: 'Product not found' });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(400).json({ detail: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return res.status(400).json({ detail: error.message });
    return res.status(200).json({ message: 'Product deleted' });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
