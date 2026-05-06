import { useState, useEffect, useCallback } from 'react';
import { getCustomers, updateCustomer, deleteCustomer, getProducts } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import type { Customer, Product, OrderItemCreate } from '../../types';

// ── Shared primitives ────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0,
      backdropFilter: 'blur(4px)',
    }}
      className="lg:items-center lg:p-4"
    >
      <div
        className="lg:rounded-2xl lg:max-w-lg"
        style={{
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxWidth: wide ? 560 : 460,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
    borderRadius: 8, padding: '10px 12px',
    fontSize: '14px', color: '#fafafa', outline: 'none',
    transition: 'border-color 0.15s',
  };
}

function labelSt(): React.CSSProperties {
  return { display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717a', marginBottom: 6 };
}

function btnPrimary(disabled = false): React.CSSProperties {
  return {
    padding: '10px 18px', fontSize: '14px', fontWeight: 500,
    color: '#fff', background: disabled ? '#5b21b6' : '#7c3aed',
    border: 'none', borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, transition: 'background 0.15s',
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: '10px 14px', fontSize: '14px', fontWeight: 400,
    color: '#71717a', background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    cursor: 'pointer', transition: 'all 0.15s',
  };
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const EMPTY_INFO = { full_name: '', phone: '', email: '' };

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState(EMPTY_INFO);
  const [items, setItems] = useState<Array<OrderItemCreate & { _key: number }>>([]);
  const [submitting, setSubmitting] = useState(false);

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
    setInfo(EMPTY_INFO); setItems([]); setStep(1); setIsCreateOpen(true);
  }

  function goToStep2() {
    if (!info.full_name.trim() || !info.phone.trim()) return;
    if (products.length > 0 && items.length === 0) {
      setItems([{ _key: Date.now(), product_id: products[0].id, quantity: 1, unit_price: products[0].normal_price }]);
    }
    setStep(2);
  }

  function addItem() {
    setItems(prev => [...prev, { _key: Date.now(), product_id: products[0]?.id ?? 0, quantity: 1, unit_price: products[0]?.normal_price ?? 0 }]);
  }

  function updateItem(key: number, field: keyof OrderItemCreate, value: number) {
    setItems(prev => prev.map(i => {
      if (i._key !== key) return i;
      const next = { ...i, [field]: value };
      if (field === 'product_id') {
        const p = products.find(p => p.id === value);
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
        ? `${info.full_name} cadastrado com pedido de ${fmt(orderTotal)}`
        : `${info.full_name} cadastrado como novo lead`;
      toast.success(msg);
      setIsCreateOpen(false);
      loadCustomers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao cadastrar cliente');
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
      toast.success('Cliente atualizado');
      setEditingCustomer(null);
      loadCustomers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar cliente');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const name = customers.find(c => c.id === id)?.full_name ?? 'Cliente';
    try {
      await deleteCustomer(id);
      toast.success(`${name} excluído`);
      setDeleteConfirmId(null);
      loadCustomers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir cliente');
    }
  }

  function whatsappLink(phone: string) {
    return `https://wa.me/55${phone.replace(/\D/g, '')}`;
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────
  const SkeletonRow = () => (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {[160, 110, 140, 60].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div className="skeleton rounded" style={{ height: 13, width: w }} />
        </td>
      ))}
    </tr>
  );

  const SkeletonCard = () => (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="skeleton rounded" style={{ height: 14, width: 160, marginBottom: 8 }} />
      <div className="skeleton rounded" style={{ height: 12, width: 120 }} />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 3 }}>
            Clientes
          </h1>
          <p style={{ fontSize: '13px', color: '#52525b' }}>
            {loading ? '—' : `${customers.length} cadastrados`}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={btnPrimary()}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Novo Cliente</span>
            <span className="sm:hidden">Novo</span>
          </span>
        </button>
      </div>

      <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: '13px', color: '#f87171', marginBottom: 8 }}>{error}</p>
            <button onClick={loadCustomers} style={{ fontSize: '13px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            {/* ── Mobile card list ──────────────────────────────────────────── */}
            <div className="block lg:hidden">
              {loading
                ? [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
                : customers.length === 0
                  ? <p style={{ textAlign: 'center', padding: '60px 0', fontSize: '13px', color: '#3f3f46' }}>Nenhum cliente cadastrado ainda.</p>
                  : customers.map((c, idx) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '14px 16px',
                        borderBottom: idx < customers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: 4, letterSpacing: '-0.01em' }}>
                            {c.full_name}
                          </p>
                          <a
                            href={whatsappLink(c.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: '13px', color: '#34d399', textDecoration: 'none',
                              marginBottom: c.email ? 3 : 0,
                            }}
                          >
                            <WhatsAppIcon />
                            {c.phone}
                          </a>
                          {c.email && <p style={{ fontSize: '12px', color: '#52525b' }}>{c.email}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => openEdit(c)}
                            style={{
                              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 8, cursor: 'pointer', color: '#71717a',
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(c.id)}
                            style={{
                              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
                              borderRadius: 8, cursor: 'pointer', color: '#f87171',
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* ── Desktop table ─────────────────────────────────────────────── */}
            <div className="hidden lg:block">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Nome', 'Telefone', 'E-mail', 'Ações'].map(h => (
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
                    ? [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
                    : customers.length === 0
                      ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '60px 0', fontSize: '13px', color: '#3f3f46' }}>
                            Nenhum cliente cadastrado ainda.
                          </td>
                        </tr>
                      )
                      : customers.map(c => (
                        <tr
                          key={c.id}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: '#fafafa' }}>{c.full_name}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <a
                              href={whatsappLink(c.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '13px', color: '#34d399', textDecoration: 'none' }}
                            >
                              <WhatsAppIcon />
                              {c.phone}
                            </a>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#52525b' }}>{c.email ?? '—'}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => openEdit(c)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 4, transition: 'color 0.15s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(c.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 4, transition: 'color 0.15s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
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
            </div>
          </>
        )}
      </div>

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      {isCreateOpen && (
        <Modal title={step === 1 ? 'Novo Cliente' : `Pedido · ${info.full_name}`} onClose={() => setIsCreateOpen(false)} wide>
          {step === 1 ? (
            <div>
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
                    onChange={e => setInfo({ ...info, full_name: e.target.value })}
                    placeholder="Maria Silva" />
                </div>
                <div>
                  <label style={labelSt()}>Telefone <span style={{ color: '#f87171' }}>*</span></label>
                  <input style={inputSt(focused === 'phone')} type="tel" value={info.phone}
                    onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}
                    onChange={e => setInfo({ ...info, phone: e.target.value })}
                    placeholder="(71) 99999-9999" />
                </div>
                <div>
                  <label style={labelSt()}>E-mail</label>
                  <input style={inputSt(focused === 'email')} type="email" value={info.email}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    onChange={e => setInfo({ ...info, email: e.target.value })}
                    placeholder="maria@email.com" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 8 }}>
                <button type="button" onClick={() => handleCreate(false)}
                  disabled={!info.full_name.trim() || !info.phone.trim() || submitting}
                  style={{ fontSize: '13px', color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>
                  {submitting ? 'Cadastrando...' : 'Cadastrar sem pedido'}
                </button>
                {products.length > 0 ? (
                  <button type="button" onClick={goToStep2}
                    disabled={!info.full_name.trim() || !info.phone.trim()}
                    style={btnPrimary(!info.full_name.trim() || !info.phone.trim())}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Adicionar Pedido
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <button type="button" onClick={() => handleCreate(false)}
                    disabled={!info.full_name.trim() || !info.phone.trim() || submitting}
                    style={btnPrimary(!info.full_name.trim() || !info.phone.trim() || submitting)}>
                    {submitting ? 'Cadastrando...' : 'Cadastrar'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
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

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717a' }}>Produtos</p>
                  <button type="button" onClick={addItem}
                    style={{ fontSize: '12px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    + Adicionar item
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(item => {
                    const p = products.find(p => p.id === item.product_id);
                    return (
                      <div key={item._key} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        {p?.photo_url && <img src={p.photo_url} alt={p.name} style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 2fr 3fr 1fr', gap: 6, alignItems: 'center' }}>
                          <select value={item.product_id}
                            onChange={e => updateItem(item._key, 'product_id', Number(e.target.value))}
                            style={{ ...inputSt(), padding: '6px 8px', fontSize: '12px', background: '#18181b' }}>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="number" min={1} value={item.quantity}
                            onChange={e => updateItem(item._key, 'quantity', Number(e.target.value))}
                            style={{ ...inputSt(), padding: '6px 8px', fontSize: '12px', textAlign: 'center' }} />
                          <input type="number" step="0.01" min={0} value={item.unit_price}
                            onChange={e => updateItem(item._key, 'unit_price', Number(e.target.value))}
                            style={{ ...inputSt(), padding: '6px 8px', fontSize: '12px' }} />
                          <button type="button" onClick={() => setItems(prev => prev.filter(i => i._key !== item._key))}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
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
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div>
                <label style={labelSt()}>Telefone <span style={{ color: '#f87171' }}>*</span></label>
                <input style={inputSt(focused === 'edit_phone')} type="tel" required value={editForm.phone}
                  onFocus={() => setFocused('edit_phone')} onBlur={() => setFocused(null)}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelSt()}>E-mail</label>
                <input style={inputSt(focused === 'edit_email')} type="email" value={editForm.email}
                  onFocus={() => setFocused('edit_email')} onBlur={() => setFocused(null)}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
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
          <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: 24, lineHeight: 1.6 }}>
            Tem certeza? Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setDeleteConfirmId(null)} style={btnGhost()}>Cancelar</button>
            <button onClick={() => handleDelete(deleteConfirmId)}
              style={{ ...btnPrimary(), background: '#dc2626' }}>
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
