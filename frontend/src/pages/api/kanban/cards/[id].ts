import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('kanban_cards').delete().eq('id', id);
    if (error) return res.status(400).json({ detail: error.message });
    return res.status(200).json({ message: 'Card deleted' });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
