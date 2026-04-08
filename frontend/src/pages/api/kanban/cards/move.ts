import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

const VALID_STATUSES = new Set(['novo', 'contato', 'pedido', 'pago', 'entregue']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  const { card_id, new_status } = req.body;
  if (!card_id || !new_status) return res.status(400).json({ detail: 'card_id e new_status são obrigatórios' });
  if (!VALID_STATUSES.has(new_status)) return res.status(400).json({ detail: 'Status inválido' });

  const { data, error } = await supabase
    .from('kanban_cards')
    .update({ status: new_status })
    .eq('id', card_id)
    .select()
    .single();

  if (error) return res.status(400).json({ detail: error.message });
  return res.status(200).json({ message: 'Card movido', data });
}
