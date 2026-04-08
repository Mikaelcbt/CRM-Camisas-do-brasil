import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

const VALID_STATUSES = new Set(['pending', 'paid', 'delivered', 'cancelled']);

/** Move the customer's kanban card to a new stage (uses the most recent card) */
async function moveCustomerCard(customer_id: number, kanban_status: string) {
  await supabase
    .from('kanban_cards')
    .update({ status: kanban_status })
    .eq('customer_id', customer_id);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const skip = Number(req.query.skip ?? 0);
    const limit = Math.min(Number(req.query.limit ?? 100), 200);

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), customers(full_name)')
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ detail: error.message });

    const result = (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      customer_name: (row.customers as { full_name: string } | null)?.full_name ?? null,
      items: row.order_items ?? [],
      customers: undefined,
      order_items: undefined,
    }));

    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const { customer_id, status = 'pending', notes, items } = req.body;

    if (!items?.length) return res.status(400).json({ detail: 'Pedido precisa de pelo menos 1 item' });
    if (!VALID_STATUSES.has(status)) return res.status(400).json({ detail: 'Status inválido' });

    const total = items.reduce(
      (s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0
    );

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({ customer_id, status, notes, total: Math.round(total * 100) / 100 })
      .select()
      .single();
    if (orderErr) return res.status(400).json({ detail: orderErr.message });

    const { data: createdItems, error: itemsErr } = await supabase
      .from('order_items')
      .insert(items.map((i: { product_id: number; quantity: number; unit_price: number }) => ({
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })))
      .select();
    if (itemsErr) return res.status(400).json({ detail: itemsErr.message });

    // Auto-move kanban card to 'pedido'
    await moveCustomerCard(customer_id, 'pedido');

    return res.status(201).json({ ...order, items: createdItems, customer_name: null });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
