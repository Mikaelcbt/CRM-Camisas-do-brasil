import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const listId = Number(req.query.id);
  if (!listId) return res.status(400).json({ detail: 'ID inválido' });

  if (req.method !== 'POST') return res.status(405).json({ detail: 'Method not allowed' });

  // Check list exists and is still a draft
  const { data: list, error: listErr } = await supabase
    .from('order_lists')
    .select('*')
    .eq('id', listId)
    .single();

  if (listErr || !list) return res.status(404).json({ detail: 'Lista não encontrada' });
  if (list.status === 'confirmed') return res.status(400).json({ detail: 'Lista já confirmada' });

  // Get all unconfirmed entries (no order_id yet)
  const { data: entries, error: entriesErr } = await supabase
    .from('list_entries')
    .select('*')
    .eq('list_id', listId)
    .is('order_id', null);

  if (entriesErr) return res.status(500).json({ detail: entriesErr.message });
  if (!entries || entries.length === 0) {
    // Mark confirmed even if all were already confirmed
    await supabase.from('order_lists').update({ status: 'confirmed' }).eq('id', listId);
    return res.status(200).json({ message: 'Lista confirmada', orders_created: 0 });
  }

  const entryIds = entries.map((e) => e.id);

  // Get all products for these entries
  const { data: allProducts, error: prodsErr } = await supabase
    .from('list_entry_products')
    .select('*')
    .in('entry_id', entryIds);

  if (prodsErr) return res.status(500).json({ detail: prodsErr.message });

  const productsByEntry = (allProducts ?? []).reduce<Record<number, typeof allProducts>>((acc, p) => {
    if (!acc[p.entry_id]) acc[p.entry_id] = [];
    acc[p.entry_id].push(p);
    return acc;
  }, {});

  let ordersCreated = 0;

  for (const entry of entries) {
    if (!entry.customer_id) continue; // should not happen but guard

    const entryProducts = productsByEntry[entry.id] ?? [];
    if (entryProducts.length === 0) continue;

    const total = entryProducts.reduce((s, p) => s + p.quantity * p.unit_price, 0);

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        customer_id: entry.customer_id,
        status: 'pending',
        notes: entry.notes ?? null,
        total,
        list_id: listId,
      })
      .select()
      .single();

    if (orderErr) continue; // skip this entry on error

    // Create order items
    await supabase.from('order_items').insert(
      entryProducts.map((p) => ({
        order_id: order.id,
        product_id: p.product_id,
        quantity: p.quantity,
        unit_price: p.unit_price,
      }))
    );

    // Move kanban card to 'pedido'
    await supabase
      .from('kanban_cards')
      .update({ status: 'pedido' })
      .eq('customer_id', entry.customer_id);

    // Update entry with order_id
    await supabase
      .from('list_entries')
      .update({ order_id: order.id })
      .eq('id', entry.id);

    ordersCreated++;
  }

  // Mark list as confirmed
  await supabase.from('order_lists').update({ status: 'confirmed' }).eq('id', listId);

  return res.status(200).json({ message: 'Lista confirmada', orders_created: ordersCreated });
}
