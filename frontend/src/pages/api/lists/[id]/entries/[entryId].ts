import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const entryId = Number(req.query.entryId);
  if (!entryId) return res.status(400).json({ detail: 'Entry ID inválido' });

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('list_entries')
      .delete()
      .eq('id', entryId);

    if (error) return res.status(400).json({ detail: error.message });
    return res.status(200).json({ message: 'Entrada removida' });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
