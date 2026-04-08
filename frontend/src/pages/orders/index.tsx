import { useState, useEffect, useCallback } from 'react';
import { getOrders, createOrder, updateOrder, deleteOrder, getCustomers, getProducts } from '../../utils/api';
import type { Order, OrderCreate, Customer, Product, OrderStatus } from '../../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   'Aguardando',
  paid:      'Pago',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const STATUS_STYLES: Record<OrderStatus, { bg: string; color: string; border: string }> = {
  pending:   { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
  paid:      { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.2)' },
  delivered: { bg: 'rgba(56,189,248,0.1)',  color: '#38bdf8', border: 'rgba(56,189,248,0.2)' },
  cancelled: { bg: 'rgba(248,113,113,0.1)', color: '#f87171', border: 'rgba(248,113,113,0.2)' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 20,
      fontSize: '11px', fontWeight: 500,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#111113', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, width: '100%', maxWidth: wide ? 600 : 440,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 4 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

function inputSt(focused = false): React.CSSProperties {
  return {
    width: '100%', background: '#18181b',
    border: `1px solid ${focused ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 8, padding: '8px 12px',
    fontSize: '13px', color: '#fafafa', outline: 'none',
    transition: 'border-color 0.15s',
  };
}

function labelSt(): React.CSSProperties {
  return { display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717a', marginBottom: 6 };
}

const SkeletonRow = () => (
  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    {[40, 140, 80, 90, 70, 100].map((w, i) => (
      <td key={i} style={{ padding: '14px 14px' }}>
        <div className="skeleton rounded" style={{ height: 13, width: w }} />
      </td>
    ))}
  </tr>
);

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null);

  const [customerId, setCustomerId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ _key: 0, product_id: 0, quantity: 1, unit_price: 0 }]);
  const [focused, setFocused] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders(await getOrders()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadOrders();
    getCustomers().then(setCustomers).catch(console.error);
    getProducts().then(setProducts).catch(console.error);
  }, [loadOrders]);

  async function markPaid(id: number) {
    setMarkingPaidId(id);
    try {
      await updateOrder(id, { status: 'paid' });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'paid' } : o));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro');
    } finally {
      setMarkingPaidId(null);
    }
  }

  async function markDelivered(id: number) {
    try {
      await updateOrder(id, { status: 'delivered' });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'delivered' } : o));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro');
    }
  }

  function openCreate() {
    setCustomerId(''); setNotes('');
    setItems([{ _key: 0, product_id: products[0]?.id ?? 0, quantity: 1, unit_price: products[0]?.normal_price ?? 0 }]);
    setIsCreateOpen(true);
  }

  function updateItem(key: number, field: string, value: number) {
    setItems((prev) => prev.map((i) => {
      if (i._key !== key) return i;
      const next = { ...i, [field]: value };
      if (field === 'product_id') {
        const p = products.find((p) => p.id === value);
        if (p) next.unit_price = p.normal_price;
      }
      return next;
    }));
  }

  const orderTotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setSubmitting(true);
    try {
      const payload: OrderCreate = {
        customer_id: customerId as number,
        status: 'pending',
        notes: notes || undefined,
        items: items.filter((i) => i.product_id > 0).map(({ _key: _, ...rest }) => rest),
      };
      await createOrder(payload);
      setIsCreateOpen(false);
      loadOrders();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try { await deleteOrder(id); setDeleteConfirmId(null); loadOrders(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro'); }
  }

  const pendingTotal = orders.filter((o) => o.status === 'pending').reduce((s, o) => s + o.total, 0);
  const paidTotal = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 3 }}>
            Vendas
          </h1>
          <p style={{ fontSize: '13px', color: '#52525b' }}>
            {loading ? '—' : `${orders.length} pedidos`}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            transition: 'background 0.15s', letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova Venda
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'A Receber', value: fmt(pendingTotal), sub: `${pendingCount} ${pendingCount === 1 ? 'pedido' : 'pedidos'}`, color: '#fbbf24' },
          { label: 'Recebido',  value: fmt(paidTotal), sub: `${orders.filter((o) => o.status === 'paid').length} pagos`, color: '#34d399' },
          { label: 'Total Geral', value: fmt(pendingTotal + paidTotal), sub: `${orders.filter((o) => o.status !== 'cancelled').length} ativos`, color: '#fafafa' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 500, color: '#52525b', marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</p>
            <p style={{ fontSize: '11px', color: '#3f3f46', marginTop: 3 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '13px', color: '#f87171', marginBottom: 8 }}>{error}</p>
            <button onClick={loadOrders} style={{ fontSize: '13px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['#', 'Cliente', 'Total', 'Status', 'Data', 'Ações'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 600, color: '#52525b',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
                : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', fontSize: '13px', color: '#3f3f46' }}>
                      Nenhuma venda ainda.
                    </td>
                  </tr>
                ) : orders.map((o) => (
                  <tr
                    key={o.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '13px 14px', fontSize: '11px', color: '#3f3f46', fontFamily: 'monospace' }}>#{o.id}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em', marginBottom: 2 }}>
                        {o.customer_name ?? `Cliente #${o.customer_id}`}
                      </p>
                      <p style={{ fontSize: '11px', color: '#52525b' }}>
                        {o.items.length} {o.items.length === 1 ? 'item' : 'itens'}
                      </p>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: '14px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>
                      {fmt(o.total)}
                    </td>
                    <td style={{ padding: '13px 14px' }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: '13px 14px', fontSize: '12px', color: '#52525b' }}>{fmtDate(o.created_at)}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {o.status === 'pending' && (
                          <button
                            onClick={() => markPaid(o.id)}
                            disabled={markingPaidId === o.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              background: 'rgba(52,211,153,0.12)', color: '#34d399',
                              border: '1px solid rgba(52,211,153,0.2)',
                              borderRadius: 7, padding: '5px 10px',
                              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                              opacity: markingPaidId === o.id ? 0.6 : 1,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.2)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.12)'; }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Pago
                          </button>
                        )}
                        {o.status === 'paid' && (
                          <button
                            onClick={() => markDelivered(o.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              background: 'rgba(56,189,248,0.1)', color: '#38bdf8',
                              border: '1px solid rgba(56,189,248,0.2)',
                              borderRadius: 7, padding: '5px 10px',
                              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(56,189,248,0.18)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(56,189,248,0.1)'; }}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 10-4-4" />
                            </svg>
                            Entregue
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirmId(o.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f46', display: 'flex', padding: 4, transition: 'color 0.15s' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46'; }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Modal ───────────────────────────────────────────────────── */}
      {isCreateOpen && (
        <Modal title="Nova Venda" onClose={() => setIsCreateOpen(false)} wide>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelSt()}>Cliente <span style={{ color: '#f87171' }}>*</span></label>
              <select required value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}
                style={{ ...inputSt(focused === 'cust'), background: '#18181b' }}
                onFocus={() => setFocused('cust')} onBlur={() => setFocused(null)}
              >
                <option value="">Selecione um cliente...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={labelSt()}>Produtos <span style={{ color: '#f87171' }}>*</span></label>
                <button type="button"
                  onClick={() => setItems((p) => [...p, { _key: Date.now(), product_id: products[0]?.id ?? 0, quantity: 1, unit_price: products[0]?.normal_price ?? 0 }])}
                  style={{ fontSize: '12px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  + Adicionar item
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item) => {
                  const p = products.find((p) => p.id === item.product_id);
                  return (
                    <div key={item._key} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {p?.photo_url && <img src={p.photo_url} alt={p.name} style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 2fr 3fr 1fr', gap: 6, alignItems: 'center' }}>
                        <select value={item.product_id} onChange={(e) => updateItem(item._key, 'product_id', Number(e.target.value))}
                          style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px', background: '#18181b' }}>
                          <option value={0}>Produto...</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="number" min={1} value={item.quantity}
                          onChange={(e) => updateItem(item._key, 'quantity', Number(e.target.value))}
                          style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px', textAlign: 'center' }} />
                        <input type="number" step="0.01" min={0} value={item.unit_price}
                          onChange={(e) => updateItem(item._key, 'unit_price', Number(e.target.value))}
                          style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px' }} />
                        <button type="button" disabled={items.length === 1}
                          onClick={() => setItems((p) => p.filter((i) => i._key !== item._key))}
                          style={{ background: 'none', border: 'none', cursor: items.length === 1 ? 'default' : 'pointer', color: '#52525b', display: 'flex', justifyContent: 'center', opacity: items.length === 1 ? 0.3 : 1 }}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, marginBottom: 16,
            }}>
              <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Total</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.02em' }}>{fmt(orderTotal)}</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelSt()}>Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Tamanho, cor, prazo..."
                onFocus={() => setFocused('notes')} onBlur={() => setFocused(null)}
                style={{ ...inputSt(focused === 'notes'), resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setIsCreateOpen(false)}
                style={{ padding: '8px 14px', fontSize: '13px', color: '#71717a', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={submitting || !customerId}
                style={{
                  padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff',
                  background: submitting || !customerId ? '#5b21b6' : '#7c3aed',
                  border: 'none', borderRadius: 8, cursor: submitting || !customerId ? 'not-allowed' : 'pointer',
                  opacity: submitting || !customerId ? 0.6 : 1, letterSpacing: '-0.01em',
                }}>
                {submitting ? 'Criando...' : 'Criar Venda'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteConfirmId !== null && (
        <Modal title="Excluir Venda" onClose={() => setDeleteConfirmId(null)}>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: 20 }}>Tem certeza? Esta ação não pode ser desfeita.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setDeleteConfirmId(null)}
              style={{ padding: '8px 14px', fontSize: '13px', color: '#71717a', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={() => handleDelete(deleteConfirmId)}
              style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
