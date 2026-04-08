import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ detail: 'ID inválido' });

  // GET — fetch list with all entries + products
  if (req.method === 'GET') {
    const { data: list, error: listErr } = await supabase
      .from('order_lists')
      .select('*')
      .eq('id', id)
      .single();

    if (listErr || !list) return res.status(404).json({ detail: 'Lista não encontrada' });

    const { data: entries, error: entriesErr } = await supabase
      .from('list_entries')
      .select('*')
      .eq('list_id', id)
      .order('created_at');

    if (entriesErr) return res.status(500).json({ detail: entriesErr.message });

    const entryIds = (entries ?? []).map((e) => e.id);
    let products: Record<number, unknown[]> = {};

    if (entryIds.length > 0) {
      const { data: prods } = await supabase
        .from('list_entry_products')
        .select('*')
        .in('entry_id', entryIds);

      products = (prods ?? []).reduce<Record<number, unknown[]>>((acc, p) => {
        if (!acc[p.entry_id]) acc[p.entry_id] = [];
        acc[p.entry_id].push(p);
        return acc;
      }, {});
    }

    const enrichedEntries = (entries ?? []).map((e) => {
      const prods = (products[e.id] ?? []) as Array<{ quantity: number; unit_price: number }>;
      const total = prods.reduce((s, p) => s + p.quantity * p.unit_price, 0);
      return { ...e, products: products[e.id] ?? [], total };
    });

    const listTotal = enrichedEntries.reduce((s, e) => s + e.total, 0);

    return res.status(200).json({
      ...list,
      entries: enrichedEntries,
      entry_count: enrichedEntries.length,
      total: listTotal,
    });
  }

  // DELETE — delete list (cascade deletes entries + products)
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('order_lists').delete().eq('id', id);
    if (error) return res.status(400).json({ detail: error.message });
    return res.status(200).json({ message: 'Lista excluída' });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
