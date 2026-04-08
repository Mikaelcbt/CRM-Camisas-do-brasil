import { useState, useEffect, useCallback } from 'react';
import { getCustomers, updateCustomer, deleteCustomer, getProducts } from '../../utils/api';
import type { Customer, Product, OrderItemCreate } from '../../types';

// ── Shared primitives ────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        width: '100%',
        maxWidth: wide ? 520 : 440,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
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

function btnPrimary(disabled = false): React.CSSProperties {
  return {
    padding: '8px 16px', fontSize: '13px', fontWeight: 500,
    color: '#fff', background: disabled ? '#5b21b6' : '#7c3aed',
    border: 'none', borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, transition: 'background 0.15s',
    letterSpacing: '-0.01em',
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: '8px 14px', fontSize: '13px', fontWeight: 400,
    color: '#71717a', background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    cursor: 'pointer', transition: 'all 0.15s',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY_INFO = { full_name: '', phone: '', email: '' };

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState(EMPTY_INFO);
  const [items, setItems] = useState<Array<OrderItemCreate & { _key: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCustomers(await getCustomers()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar clientes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadCustomers();
    getProducts().then(setProducts).catch(console.error);
  }, [loadCustomers]);

  function openCreate() {
    setInfo(EMPTY_INFO); setItems([]); setStep(1); setSuccessMsg(null); setIsCreateOpen(true);
  }

  function goToStep2() {
    if (!info.full_name.trim() || !info.phone.trim()) return;
    if (products.length > 0 && items.length === 0) {
      setItems([{ _key: Date.now(), product_id: products[0].id, quantity: 1, unit_price: products[0].normal_price }]);
    }
    setStep(2);
  }

  function addItem() {
    setItems((prev) => [...prev, { _key: Date.now(), product_id: products[0]?.id ?? 0, quantity: 1, unit_price: products[0]?.normal_price ?? 0 }]);
  }

  function updateItem(key: number, field: keyof OrderItemCreate, value: number) {
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

  async function handleCreate(withOrder: boolean) {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { ...info };
      if (withOrder && items.length > 0) {
        body.items = items.map(({ _key: _, ...rest }) => rest);
      }
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }

      const msg = withOrder && items.length > 0
        ? `${info.full_name} cadastrado com pedido de ${fmt(orderTotal)} — foi direto pro Pipeline!`
        : `${info.full_name} cadastrado como novo lead.`;
      setSuccessMsg(msg);
      loadCustomers();
      setTimeout(() => { setIsCreateOpen(false); setSuccessMsg(null); }, 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao cadastrar cliente');
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(c: Customer) {
    setEditingCustomer(c);
    setEditForm({ full_name: c.full_name, phone: c.phone, email: c.email ?? '' });
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditSubmitting(true);
    try {
      await updateCustomer(editingCustomer.id, {
        full_name: editForm.full_name,
        phone: editForm.phone,
        email: editForm.email || undefined,
      });
      setEditingCustomer(null);
      loadCustomers();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar cliente');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCustomer(id);
      setDeleteConfirmId(null);
      loadCustomers();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir cliente');
    }
  }

  // ── Skeleton rows ─────────────────────────────────────────────────────────
  const SkeletonRow = () => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {[160, 110, 140, 60].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="skeleton rounded" style={{ height: 13, width: w }} />
        </td>
      ))}
    </tr>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 3 }}>
            Clientes
          </h1>
          <p style={{ fontSize: '13px', color: '#52525b' }}>
            {loading ? '—' : `${customers.length} cadastrados · novos clientes vão direto pro Pipeline`}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={btnPrimary()}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Novo Cliente
          </span>
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '13px', color: '#f87171', marginBottom: 8 }}>{error}</p>
            <button onClick={loadCustomers} style={{ fontSize: '13px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Nome', 'Telefone', 'E-mail', 'Ações'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 600, color: '#52525b',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
                : customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '60px 0', fontSize: '13px', color: '#3f3f46' }}>
                      Nenhum cliente cadastrado ainda.
                    </td>
                  </tr>
                ) : customers.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em' }}>{c.full_name}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#a1a1aa' }}>{c.phone}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#52525b' }}>{c.email ?? '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => openEdit(c)}
                          title="Editar"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 4, transition: 'color 0.15s' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(c.id)}
                          title="Excluir"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 4, transition: 'color 0.15s' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
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

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      {isCreateOpen && (
        <Modal title={step === 1 ? 'Novo Cliente' : `Pedido · ${info.full_name}`} onClose={() => setIsCreateOpen(false)} wide>
          {successMsg ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>{successMsg}</p>
            </div>
          ) : step === 1 ? (
            <div>
              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#a78bfa' }}>Dados</span>
                </div>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', color: '#52525b', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                  <span style={{ fontSize: '12px', color: '#52525b' }}>Pedido</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelSt()}>Nome Completo <span style={{ color: '#f87171' }}>*</span></label>
                  <input style={inputSt(focused === 'name')} type="text" value={info.full_name}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                    onChange={(e) => setInfo({ ...info, full_name: e.target.value })}
                    placeholder="Maria Silva" />
                </div>
                <div>
                  <label style={labelSt()}>Telefone <span style={{ color: '#f87171' }}>*</span></label>
                  <input style={inputSt(focused === 'phone')} type="tel" value={info.phone}
                    onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                    onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                    placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label style={labelSt()}>E-mail</label>
                  <input style={inputSt(focused === 'email')} type="email" value={info.email}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    onChange={(e) => setInfo({ ...info, email: e.target.value })}
                    placeholder="maria@email.com" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => handleCreate(false)}
                  disabled={!info.full_name.trim() || !info.phone.trim() || submitting}
                  style={{ fontSize: '13px', color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {submitting ? 'Cadastrando...' : 'Cadastrar sem pedido'}
                </button>
                {products.length > 0 ? (
                  <button
                    type="button"
                    onClick={goToStep2}
                    disabled={!info.full_name.trim() || !info.phone.trim()}
                    style={btnPrimary(!info.full_name.trim() || !info.phone.trim())}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Adicionar Pedido
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCreate(false)}
                    disabled={!info.full_name.trim() || !info.phone.trim() || submitting}
                    style={btnPrimary(!info.full_name.trim() || !info.phone.trim() || submitting)}
                  >
                    {submitting ? 'Cadastrando...' : 'Cadastrar'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                  <span style={{ fontSize: '12px', color: '#34d399' }}>Dados</span>
                </div>
                <div style={{ flex: 1, height: 1, background: 'rgba(124,58,237,0.3)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#a78bfa' }}>Pedido</span>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717a' }}>Produtos</p>
                  <button type="button" onClick={addItem}
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
                        {p?.photo_url && (
                          <img src={p.photo_url} alt={p.name} style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 2fr 3fr 1fr', gap: 6, alignItems: 'center' }}>
                          <select
                            value={item.product_id}
                            onChange={(e) => updateItem(item._key, 'product_id', Number(e.target.value))}
                            style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px', background: '#18181b' }}
                          >
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="number" min={1} value={item.quantity}
                            onChange={(e) => updateItem(item._key, 'quantity', Number(e.target.value))}
                            style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px', textAlign: 'center' }} />
                          <input type="number" step="0.01" min={0} value={item.unit_price}
                            onChange={(e) => updateItem(item._key, 'unit_price', Number(e.target.value))}
                            style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px' }} />
                          <button type="button" onClick={() => setItems((prev) => prev.filter((i) => i._key !== item._key))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', justifyContent: 'center' }}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {items.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, marginBottom: 16,
                }}>
                  <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Total do Pedido</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.02em' }}>{fmt(orderTotal)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ fontSize: '13px', color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Voltar
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => handleCreate(false)} disabled={submitting} style={btnGhost()}>
                    Sem pedido
                  </button>
                  <button type="button" onClick={() => handleCreate(true)}
                    disabled={submitting || items.length === 0}
                    style={btnPrimary(submitting || items.length === 0)}>
                    {submitting ? 'Criando...' : 'Confirmar Pedido'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editingCustomer && (
        <Modal title="Editar Cliente" onClose={() => setEditingCustomer(null)}>
          <form onSubmit={handleEdit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={labelSt()}>Nome Completo <span style={{ color: '#f87171' }}>*</span></label>
                <input style={inputSt(focused === 'edit_name')} type="text" required value={editForm.full_name}
                  onFocus={() => setFocused('edit_name')} onBlur={() => setFocused(null)}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div>
                <label style={labelSt()}>Telefone <span style={{ color: '#f87171' }}>*</span></label>
                <input style={inputSt(focused === 'edit_phone')} type="tel" required value={editForm.phone}
                  onFocus={() => setFocused('edit_phone')} onBlur={() => setFocused(null)}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelSt()}>E-mail</label>
                <input style={inputSt(focused === 'edit_email')} type="email" value={editForm.email}
                  onFocus={() => setFocused('edit_email')} onBlur={() => setFocused(null)}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setEditingCustomer(null)} style={btnGhost()}>Cancelar</button>
              <button type="submit" disabled={editSubmitting} style={btnPrimary(editSubmitting)}>
                {editSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      {deleteConfirmId !== null && (
        <Modal title="Excluir Cliente" onClose={() => setDeleteConfirmId(null)}>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: 20, lineHeight: 1.6 }}>
            Tem certeza? Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setDeleteConfirmId(null)} style={btnGhost()}>Cancelar</button>
            <button onClick={() => handleDelete(deleteConfirmId)} style={{ ...btnPrimary(), background: '#dc2626' }}>
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
