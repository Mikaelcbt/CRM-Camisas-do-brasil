export interface Customer {
  id: number;
  full_name: string;
  phone: string;
  email?: string | null;
  cpf?: string | null;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
  } | null;
  preferences?: Record<string, unknown> | null;
  tags?: string[] | null;
}

export interface Product {
  id: number;
  name: string;
  normal_price: number;
  photo_url?: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer_id: number;
  customer_name?: string | null;
  status: OrderStatus;
  total: number;
  notes?: string | null;
  paid_at?: string | null;
  created_at: string;
  items: OrderItem[];
}

/** pending → aguardando pagamento | paid → pago | delivered → entregue | cancelled → cancelado */
export type OrderStatus = 'pending' | 'paid' | 'delivered' | 'cancelled';

export interface OrderItemCreate {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderCreate {
  customer_id: number;
  status?: OrderStatus;
  notes?: string;
  items: OrderItemCreate[];
}

export interface KanbanCard {
  id: number;
  content: string;
  status: KanbanStatus;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  created_at?: string;
}

/** novo → Em contato → pedido feito → pago → entregue */
export type KanbanStatus = 'novo' | 'contato' | 'pedido' | 'pago' | 'entregue';

// ── Order Lists ──────────────────────────────────────────────────────────────

export interface OrderList {
  id: number;
  name: string;
  notes: string | null;
  status: 'draft' | 'confirmed';
  created_at: string;
  entry_count: number;
  total: number;
}

export interface ListEntryProduct {
  id: number;
  entry_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface ListEntry {
  id: number;
  list_id: number;
  customer_id: number | null;
  customer_name: string;
  customer_phone: string | null;
  notes: string | null;
  order_id: number | null;
  created_at: string;
  products: ListEntryProduct[];
  total: number;
}

export interface OrderListDetail extends OrderList {
  entries: ListEntry[];
}

export interface PendingOrderRow {
  id: number;
  customer_name: string;
  total: number;
  created_at: string;
}

export interface DashboardStats {
  total_customers: number;
  total_products: number;
  monthly_revenue: number;
  monthly_orders: number;
  pending_orders: number;
  pending_value: number;
  pending_list: PendingOrderRow[];
}
