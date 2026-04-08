import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

const VALID_STATUSES = new Set(['pending', 'paid', 'delivered', 'cancelled']);

/** Map order status → kanban pipeline stage */
const STATUS_TO_KANBAN: Record<string, string> = {
  pending:   'pedido',
  paid:      'pago',
  delivered: 'entregue',
};

async function fetchOrder(id: number) {
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*), customers(full_name)')
    .eq('id', id)
    .single();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    ...row,
    customer_name: (row.customers as { full_name: string } | null)?.full_name ?? null,
    items: row.order_items ?? [],
    customers: undefined,
    order_items: undefined,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (isNaN(id)) return res.status(400).json({ detail: 'ID inválido' });

  if (req.method === 'GET') {
    const order = await fetchOrder(id);
    if (!order) return res.status(404).json({ detail: 'Pedido não encontrado' });
    return res.status(200).json(order);
  }

  if (req.method === 'PUT') {
    const { status, notes } = req.body as { status?: string; notes?: string };
    if (status && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ detail: 'Status inválido' });
    }

    const payload: Record<string, unknown> = {};
    if (status !== undefined) payload.status = status;
    if (notes !== undefined) payload.notes = notes;
    if (status === 'paid') payload.paid_at = new Date().toISOString();

    const { error } = await supabase.from('orders').update(payload).eq('id', id);
    if (error) return res.status(400).json({ detail: error.message });

    // Auto-move the customer's kanban card when status changes
    if (status && STATUS_TO_KANBAN[status]) {
      const { data: orderRow } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('id', id)
        .single();
      if (orderRow?.customer_id) {
        await supabase
          .from('kanban_cards')
          .update({ status: STATUS_TO_KANBAN[status] })
          .eq('customer_id', orderRow.customer_id);
      }
    }

    const order = await fetchOrder(id);
    return res.status(200).json(order);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return res.status(400).json({ detail: error.message });
    return res.status(200).json({ message: 'Pedido excluído' });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
