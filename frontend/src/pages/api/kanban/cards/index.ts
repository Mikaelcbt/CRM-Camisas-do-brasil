import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

const VALID_STATUSES = new Set(['novo', 'contato', 'pedido', 'pago', 'entregue']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('kanban_cards')
      .select('*, customers(full_name, phone)')
      .order('created_at');
    if (error) return res.status(500).json({ detail: error.message });

    const result = (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      customer_name: (row.customers as { full_name: string } | null)?.full_name ?? null,
      customer_phone: (row.customers as { phone: string } | null)?.phone ?? null,
      customers: undefined,
    }));
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const { content, status = 'novo', customer_id } = req.body;
    if (!content?.trim()) return res.status(400).json({ detail: 'Content é obrigatório' });
    if (!VALID_STATUSES.has(status)) return res.status(400).json({ detail: 'Status inválido' });

    const { data, error } = await supabase
      .from('kanban_cards')
      .insert({ content: content.trim(), status, customer_id: customer_id ?? null })
      .select('*, customers(full_name, phone)')
      .single();
    if (error) return res.status(400).json({ detail: error.message });

    const row = data as Record<string, unknown>;
    return res.status(201).json({
      ...row,
      customer_name: (row.customers as { full_name: string } | null)?.full_name ?? null,
      customer_phone: (row.customers as { phone: string } | null)?.phone ?? null,
      customers: undefined,
    });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
