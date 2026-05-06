import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { withAuth } from '../../../lib/withAuth';

const VALID_STATUSES = new Set(['pending', 'paid', 'delivered', 'cancelled']);

interface OrderItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export default withAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const skip = Number(req.query.skip ?? 0);
    const limit = Math.min(Number(req.query.limit ?? 100), 200);
    const customerId = req.query.customer_id ? Number(req.query.customer_id) : null;
    const statusFilter = req.query.status as string | undefined;

    let query = supabase
      .from('orders')
      .select('*, order_items(*), customers(full_name)')
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (statusFilter && VALID_STATUSES.has(statusFilter)) query = query.eq('status', statusFilter);

    const { data, error } = await query;
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
      .insert(items.map((i: OrderItemInput) => ({
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })))
      .select();
    if (itemsErr) return res.status(400).json({ detail: itemsErr.message });

    await supabase
      .from('kanban_cards')
      .update({ status: 'pedido' })
      .eq('customer_id', customer_id);

    return res.status(201).json({ ...order, items: createdItems, customer_name: null });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
});
