import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

interface OrderItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const skip = Number(req.query.skip ?? 0);
    const limit = Math.min(Number(req.query.limit ?? 100), 200);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ detail: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { items, ...customerData } = req.body as {
      full_name: string;
      phone: string;
      email?: string;
      items?: OrderItemInput[];
    };

    if (!customerData.full_name?.trim() || !customerData.phone?.trim()) {
      return res.status(400).json({ detail: 'Nome e telefone são obrigatórios' });
    }

    // 1. Create customer
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();
    if (customerErr) return res.status(400).json({ detail: customerErr.message });

    const hasOrder = Array.isArray(items) && items.length > 0;

    // 2. Create kanban card — 'pedido' if order included, 'novo' otherwise
    await supabase.from('kanban_cards').insert({
      content: customer.full_name,
      status: hasOrder ? 'pedido' : 'novo',
      customer_id: customer.id,
    });

    // 3. Create order + items if provided
    if (hasOrder) {
      const total = items!.reduce((s, i) => s + i.quantity * i.unit_price, 0);

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ customer_id: customer.id, status: 'pending', total: Math.round(total * 100) / 100 })
        .select()
        .single();

      if (!orderErr && order) {
        await supabase.from('order_items').insert(
          items!.map((i) => ({ order_id: order.id, ...i }))
        );
      }
    }

    return res.status(201).json(customer);
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
