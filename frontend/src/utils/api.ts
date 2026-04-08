import type {
  Customer,
  Product,
  Order,
  OrderCreate,
  KanbanCard,
  DashboardStats,
  OrderList,
  OrderListDetail,
} from '../types';

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail ?? `Erro: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// Dashboard
export const getDashboardStats = (): Promise<DashboardStats> =>
  fetchAPI('/api/dashboard/stats');

// Customers
export const getCustomers = (skip = 0, limit = 100): Promise<Customer[]> =>
  fetchAPI(`/api/customers?skip=${skip}&limit=${limit}`);

export const getCustomer = (id: number): Promise<Customer> =>
  fetchAPI(`/api/customers/${id}`);

export const createCustomer = (data: Omit<Customer, 'id'>): Promise<Customer> =>
  fetchAPI('/api/customers', { method: 'POST', body: JSON.stringify(data) });

export const updateCustomer = (id: number, data: Partial<Omit<Customer, 'id'>>): Promise<Customer> =>
  fetchAPI(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCustomer = (id: number): Promise<{ message: string }> =>
  fetchAPI(`/api/customers/${id}`, { method: 'DELETE' });

// Products
export const getProducts = (skip = 0, limit = 100): Promise<Product[]> =>
  fetchAPI(`/api/products?skip=${skip}&limit=${limit}`);

export const getProduct = (id: number): Promise<Product> =>
  fetchAPI(`/api/products/${id}`);

export const createProduct = (data: Omit<Product, 'id'>): Promise<Product> =>
  fetchAPI('/api/products', { method: 'POST', body: JSON.stringify(data) });

export const updateProduct = (id: number, data: Partial<Omit<Product, 'id'>>): Promise<Product> =>
  fetchAPI(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProduct = (id: number): Promise<{ message: string }> =>
  fetchAPI(`/api/products/${id}`, { method: 'DELETE' });

// Orders
export const getOrders = (skip = 0, limit = 100): Promise<Order[]> =>
  fetchAPI(`/api/orders?skip=${skip}&limit=${limit}`);

export const getOrder = (id: number): Promise<Order> =>
  fetchAPI(`/api/orders/${id}`);

export const createOrder = (data: OrderCreate): Promise<Order> =>
  fetchAPI('/api/orders', { method: 'POST', body: JSON.stringify(data) });

export const updateOrder = (id: number, data: { status?: string; notes?: string }): Promise<Order> =>
  fetchAPI(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteOrder = (id: number): Promise<{ message: string }> =>
  fetchAPI(`/api/orders/${id}`, { method: 'DELETE' });

// Product image upload
export async function uploadProductImage(file: File): Promise<string> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const result = await fetchAPI<{ url: string }>('/api/products/upload', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, data, type: file.type }),
  });
  return result.url;
}

// Kanban
export const getKanbanCards = (): Promise<KanbanCard[]> =>
  fetchAPI('/api/kanban/cards');

export const createKanbanCard = (data: { content: string; status: string }): Promise<KanbanCard> =>
  fetchAPI('/api/kanban/cards', { method: 'POST', body: JSON.stringify(data) });

export const deleteKanbanCard = (id: number): Promise<{ message: string }> =>
  fetchAPI(`/api/kanban/cards/${id}`, { method: 'DELETE' });

export const moveKanbanCard = (card_id: number, new_status: string): Promise<{ message: string }> =>
  fetchAPI('/api/kanban/cards/move', {
    method: 'POST',
    body: JSON.stringify({ card_id, new_status }),
  });

// Order Lists
export const getOrderLists = (): Promise<OrderList[]> =>
  fetchAPI('/api/lists');

export const createOrderList = (data: { name: string; notes?: string }): Promise<OrderList> =>
  fetchAPI('/api/lists', { method: 'POST', body: JSON.stringify(data) });

export const getOrderList = (id: number): Promise<OrderListDetail> =>
  fetchAPI(`/api/lists/${id}`);

export const deleteOrderList = (id: number): Promise<{ message: string }> =>
  fetchAPI(`/api/lists/${id}`, { method: 'DELETE' });

export const addListEntry = (
  listId: number,
  data: {
    customer_id?: number;
    customer_name: string;
    customer_phone?: string;
    email?: string;
    notes?: string;
    products: Array<{ product_id: number; product_name: string; quantity: number; unit_price: number }>;
  }
) => fetchAPI(`/api/lists/${listId}/entries`, { method: 'POST', body: JSON.stringify(data) });

export const deleteListEntry = (listId: number, entryId: number): Promise<{ message: string }> =>
  fetchAPI(`/api/lists/${listId}/entries/${entryId}`, { method: 'DELETE' });

export const confirmOrderList = (id: number): Promise<{ message: string; orders_created: number }> =>
  fetchAPI(`/api/lists/${id}/confirm`, { method: 'POST' });
