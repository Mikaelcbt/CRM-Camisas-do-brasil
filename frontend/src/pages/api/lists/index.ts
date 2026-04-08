import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — list all order lists with entry count and total
  if (req.method === 'GET') {
    const { data: lists, error } = await supabase
      .from('order_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ detail: error.message });

    // Enrich with entry counts and totals
    const enriched = await Promise.all(
      (lists ?? []).map(async (list) => {
        const { data: entries } = await supabase
          .from('list_entries')
          .select('id')
          .eq('list_id', list.id);

        const entryIds = (entries ?? []).map((e) => e.id);
        let total = 0;
        if (entryIds.length > 0) {
          const { data: prods } = await supabase
            .from('list_entry_products')
            .select('quantity, unit_price')
            .in('entry_id', entryIds);
          total = (prods ?? []).reduce((s, p) => s + p.quantity * p.unit_price, 0);
        }

        return { ...list, entry_count: (entries ?? []).length, total };
      })
    );

    return res.status(200).json(enriched);
  }

  // POST — create new list
  if (req.method === 'POST') {
    const { name, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ detail: 'Nome é obrigatório' });

    const { data, error } = await supabase
      .from('order_lists')
      .insert({ name: name.trim(), notes: notes ?? null })
      .select()
      .single();

    if (error) return res.status(400).json({ detail: error.message });
    return res.status(201).json({ ...data, entry_count: 0, total: 0 });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
