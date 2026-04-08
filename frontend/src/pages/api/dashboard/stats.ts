import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const [customersRes, productsRes] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: ordersData, count: ordersCount } = await supabase
      .from('orders')
      .select('total, status', { count: 'exact' })
      .gte('created_at', monthStart);

    const monthlyRevenue = (ordersData ?? [])
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum: number, o: { total: number }) => sum + Number(o.total), 0);

    const pendingOrders = (ordersData ?? []).filter((o) => o.status === 'pending').length;

    res.status(200).json({
      total_customers: customersRes.count ?? 0,
      total_products: productsRes.count ?? 0,
      monthly_revenue: Math.round(monthlyRevenue * 100) / 100,
      monthly_orders: ordersCount ?? 0,
      pending_orders: pendingOrders,
    });
  } catch (e) {
    res.status(500).json({ detail: 'Internal server error' });
  }
}
