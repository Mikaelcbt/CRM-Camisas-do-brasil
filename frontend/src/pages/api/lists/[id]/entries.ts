import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const listId = Number(req.query.id);
  if (!listId) return res.status(400).json({ detail: 'ID inválido' });

  // POST — add an entry to the list
  // Body: { customer_id?, customer_name, customer_phone?, email?, notes?, products: [{product_id, product_name, quantity, unit_price}] }
  if (req.method === 'POST') {
    const { customer_id, customer_name, customer_phone, email, notes, products } = req.body;

    if (!customer_name?.trim()) return res.status(400).json({ detail: 'Nome do cliente é obrigatório' });
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ detail: 'Pelo menos um produto é obrigatório' });
    }

    let resolvedCustomerId: number | null = customer_id ?? null;

    // If no existing customer, register them now so they enter the pipeline
    if (!resolvedCustomerId) {
      if (!customer_phone?.trim()) {
        return res.status(400).json({ detail: 'Telefone é obrigatório para novo cliente' });
      }

      const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert({
          full_name: customer_name.trim(),
          phone: customer_phone.trim(),
          email: email?.trim() || null,
        })
        .select()
        .single();

      if (custErr) return res.status(400).json({ detail: custErr.message });
      resolvedCustomerId = newCustomer.id;

      // Add to kanban pipeline
      await supabase.from('kanban_cards').insert({
        content: newCustomer.full_name,
        status: 'novo',
        customer_id: newCustomer.id,
      });
    }

    // Create the list entry
    const { data: entry, error: entryErr } = await supabase
      .from('list_entries')
      .insert({
        list_id: listId,
        customer_id: resolvedCustomerId,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone?.trim() ?? null,
        notes: notes?.trim() ?? null,
      })
      .select()
      .single();

    if (entryErr) return res.status(400).json({ detail: entryErr.message });

    // Create entry products
    const productRows = products.map((p: { product_id: number; product_name: string; quantity: number; unit_price: number }) => ({
      entry_id: entry.id,
      product_id: p.product_id,
      product_name: p.product_name,
      quantity: p.quantity,
      unit_price: p.unit_price,
    }));

    const { data: savedProducts, error: prodsErr } = await supabase
      .from('list_entry_products')
      .insert(productRows)
      .select();

    if (prodsErr) return res.status(400).json({ detail: prodsErr.message });

    const total = (savedProducts ?? []).reduce((s, p) => s + p.quantity * p.unit_price, 0);

    return res.status(201).json({
      ...entry,
      products: savedProducts ?? [],
      total,
    });
  }

  return res.status(405).json({ detail: 'Method not allowed' });
}
