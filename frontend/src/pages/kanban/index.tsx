import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
  getKanbanCards, createKanbanCard, deleteKanbanCard, moveKanbanCard,
  getProducts, createOrder, updateOrder,
} from '../../utils/api';
import type { KanbanCard, KanbanStatus, Product } from '../../types';

interface Col {
  id: KanbanStatus;
  title: string;
  dotColor: string;
  bgTint: string;
  borderColor: string;
  accentColor: string;
  count?: number;
}

const COLUMNS: Col[] = [
  { id: 'novo',     title: 'Novo Lead',    dotColor: '#71717a', bgTint: 'rgba(113,113,122,0.04)', borderColor: 'rgba(113,113,122,0.15)', accentColor: '#a1a1aa' },
  { id: 'contato',  title: 'Em Contato',   dotColor: '#38bdf8', bgTint: 'rgba(56,189,248,0.04)',  borderColor: 'rgba(56,189,248,0.15)',  accentColor: '#38bdf8' },
  { id: 'pedido',   title: 'Pedido Feito', dotColor: '#fbbf24', bgTint: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.15)', accentColor: '#fbbf24' },
  { id: 'pago',     title: 'Pago ✓',       dotColor: '#a78bfa', bgTint: 'rgba(167,139,250,0.05)', borderColor: 'rgba(167,139,250,0.2)', accentColor: '#a78bfa' },
  { id: 'entregue', title: 'Entregue',     dotColor: '#34d399', bgTint: 'rgba(52,211,153,0.04)', borderColor: 'rgba(52,211,153,0.15)', accentColor: '#34d399' },
];

interface SaleItem { product_id: number; quantity: number; unit_price: number }

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
        background: '#111113', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, width: '100%', maxWidth: wide ? 520 : 380,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 4 }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ padding: 18, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

function inputSt(focused = false): React.CSSProperties {
  return {
    width: '100%', background: '#18181b',
    border: `1px solid ${focused ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 8, padding: '7px 10px',
    fontSize: '12px', color: '#fafafa', outline: 'none',
    transition: 'border-color 0.15s',
  };
}

function labelSt(): React.CSSProperties {
  return { display: 'block', fontSize: '11px', fontWeight: 500, color: '#71717a', marginBottom: 5 };
}

export default function Kanban() {
  const [isBrowser, setIsBrowser] = useState(false);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingToCol, setAddingToCol] = useState<KanbanStatus | null>(null);
  const [newCardText, setNewCardText] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [saleCard, setSaleCard] = useState<KanbanCard | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [saleNotes, setSaleNotes] = useState('');
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null);

  useEffect(() => { setIsBrowser(true); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([getKanbanCards(), getProducts()]);
      setCards(c); setProducts(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const colCards = (id: KanbanStatus) => cards.filter((c) => c.status === id);

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    const cardId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId as KanbanStatus;
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, status: newStatus } : c));
    await moveKanbanCard(cardId, newStatus).catch(() => loadData());
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!addingToCol || !newCardText.trim()) return;
    setAddSubmitting(true);
    try {
      const card = await createKanbanCard({ content: newCardText.trim(), status: addingToCol });
      setCards((prev) => [...prev, card]);
      setNewCardText(''); setAddingToCol(null);
    } catch (e) { console.error(e); }
    finally { setAddSubmitting(false); }
  }

  async function handleDeleteCard(id: number) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    await deleteKanbanCard(id).catch(() => loadData());
  }

  function openSale(card: KanbanCard) {
    setSaleCard(card);
    setSaleItems([{ product_id: products[0]?.id ?? 0, quantity: 1, unit_price: products[0]?.normal_price ?? 0 }]);
    setSaleNotes('');
  }

  function updateSaleItem(i: number, field: keyof SaleItem, value: number) {
    setSaleItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'product_id') {
        const p = products.find((p) => p.id === value);
        if (p) next[i].unit_price = p.normal_price;
      }
      return next;
    });
  }

  async function handleSaleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!saleCard?.customer_id) return;
    setSaleSubmitting(true);
    try {
      await createOrder({
        customer_id: saleCard.customer_id,
        status: 'pending',
        notes: saleNotes || undefined,
        items: saleItems.filter((i) => i.product_id > 0),
      });
      setCards((prev) => prev.map((c) => c.id === saleCard.id ? { ...c, status: 'pedido' } : c));
      setSaleCard(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar venda');
    } finally { setSaleSubmitting(false); }
  }

  async function handleMarkPaid(card: KanbanCard) {
    if (!card.customer_id) return;
    setMarkingPaidId(card.id);
    try {
      const res = await fetch(`/api/orders?limit=100`);
      const orders: Array<{ id: number; customer_id: number; status: string }> = await res.json();
      const pending = orders.find((o) => o.customer_id === card.customer_id && o.status === 'pending');
      if (pending) await updateOrder(pending.id, { status: 'paid' });
      setCards((prev) => prev.map((c) => c.id === card.id ? { ...c, status: 'pago' } : c));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro');
      loadData();
    } finally { setMarkingPaidId(null); }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const saleTotal = saleItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  if (!isBrowser) return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 4 }}>
          Pipeline de Vendas
        </h1>
        <p style={{ fontSize: '13px', color: '#52525b' }}>
          {cards.length} leads · Lead → Contato → Pedido →{' '}
          <span style={{ color: '#a78bfa', fontWeight: 500 }}>Pago</span> → Entregue
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 10, flex: 1 }}>
          {COLUMNS.map((col) => (
            <div key={col.id} style={{
              width: 228, flexShrink: 0, borderRadius: 12,
              background: col.bgTint, border: `1px solid ${col.borderColor}`,
              minHeight: 380,
            }}>
              <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: col.accentColor }}>{col.title}</span>
                </div>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton rounded-lg" style={{ height: 60 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, flex: 1, alignItems: 'flex-start' }}>
            {COLUMNS.map((col) => {
              const cards_ = colCards(col.id);
              return (
                <div
                  key={col.id}
                  style={{
                    width: 228, flexShrink: 0, borderRadius: 12,
                    background: col.bgTint,
                    border: `1px solid ${col.borderColor}`,
                    minHeight: 380,
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  {/* Column header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px 8px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.dotColor, flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: col.accentColor }}>{col.title}</span>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, color: '#3f3f46',
                        background: 'rgba(255,255,255,0.06)', borderRadius: 20,
                        padding: '1px 6px', minWidth: 18, textAlign: 'center',
                      }}>
                        {cards_.length}
                      </span>
                    </div>
                    <button
                      onClick={() => { setAddingToCol(col.id); setNewCardText(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f46', display: 'flex', padding: 2, transition: 'color 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46'; }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Add card inline form */}
                  {addingToCol === col.id && (
                    <form onSubmit={handleAddCard} style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <input
                        autoFocus type="text" value={newCardText}
                        onChange={(e) => setNewCardText(e.target.value)}
                        placeholder="Nome do lead..."
                        style={{ ...inputSt(true), marginBottom: 6 }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="submit" disabled={addSubmitting || !newCardText.trim()}
                          style={{
                            flex: 1, background: '#7c3aed', color: '#fff', border: 'none',
                            borderRadius: 7, padding: '5px 0', fontSize: '11px', fontWeight: 500,
                            cursor: addSubmitting || !newCardText.trim() ? 'not-allowed' : 'pointer',
                            opacity: addSubmitting || !newCardText.trim() ? 0.5 : 1,
                          }}>
                          Adicionar
                        </button>
                        <button type="button" onClick={() => setAddingToCol(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: '11px', padding: '5px 8px' }}>
                          ✕
                        </button>
                      </div>
                    </form>
                  )}

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          flex: 1, minHeight: 60, padding: '8px 8px 8px',
                          background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.03)' : 'transparent',
                          transition: 'background 0.15s',
                          borderRadius: '0 0 12px 12px',
                        }}
                      >
                        {cards_.map((card, index) => (
                          <Draggable key={card.id} draggableId={String(card.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  marginBottom: 6,
                                }}
                              >
                                {/* Card */}
                                <div style={{
                                  background: snapshot.isDragging ? '#1c1c1f' : '#18181b',
                                  border: `1px solid ${snapshot.isDragging ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                  borderRadius: 10,
                                  overflow: 'hidden',
                                  boxShadow: snapshot.isDragging ? '0 12px 32px rgba(0,0,0,0.5)' : 'none',
                                  transform: snapshot.isDragging ? 'rotate(1.5deg)' : 'none',
                                  transition: 'border-color 0.15s, box-shadow 0.15s',
                                }}>
                                  {/* Drag handle strip */}
                                  <div
                                    {...provided.dragHandleProps}
                                    style={{
                                      height: 3,
                                      background: `linear-gradient(90deg, ${col.dotColor}50, ${col.dotColor}20)`,
                                      cursor: 'grab',
                                    }}
                                  />
                                  <div style={{ padding: '10px 10px 8px' }}>
                                    {/* Card header */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginBottom: 6 }}>
                                      <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em', lineHeight: 1.3, wordBreak: 'break-word' }}>
                                          {card.customer_name ?? card.content}
                                        </p>
                                        {card.customer_phone && (
                                          <p style={{ fontSize: '11px', color: '#52525b', marginTop: 2 }}>{card.customer_phone}</p>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleDeleteCard(card.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f46', display: 'flex', padding: 2, transition: 'color 0.15s', flexShrink: 0 }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46'; }}
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>

                                    {/* Action buttons */}
                                    {card.customer_id && products.length > 0 && (
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        {(col.id === 'novo' || col.id === 'contato' || col.id === 'pedido') && (
                                          <button
                                            onClick={() => openSale(card)}
                                            style={{
                                              flex: 1, background: 'rgba(124,58,237,0.12)', color: '#a78bfa',
                                              border: '1px solid rgba(124,58,237,0.2)',
                                              borderRadius: 6, padding: '4px 0',
                                              fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                                              transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.2)'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.12)'; }}
                                          >
                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Pedido
                                          </button>
                                        )}
                                        {col.id === 'pedido' && (
                                          <button
                                            onClick={() => handleMarkPaid(card)}
                                            disabled={markingPaidId === card.id}
                                            style={{
                                              flex: 1, background: 'rgba(52,211,153,0.1)', color: '#34d399',
                                              border: '1px solid rgba(52,211,153,0.2)',
                                              borderRadius: 6, padding: '4px 0',
                                              fontSize: '11px', fontWeight: 500,
                                              cursor: markingPaidId === card.id ? 'not-allowed' : 'pointer',
                                              opacity: markingPaidId === card.id ? 0.5 : 1,
                                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                                              transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={(e) => { if (markingPaidId !== card.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.18)'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,211,153,0.1)'; }}
                                          >
                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Pago
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {cards_.length === 0 && !addingToCol && (
                          <p style={{ fontSize: '11px', color: '#3f3f46', textAlign: 'center', padding: '20px 0' }}>
                            Arraste aqui
                          </p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Sale Modal */}
      {saleCard && (
        <Modal title={`Pedido — ${saleCard.customer_name ?? saleCard.content}`} onClose={() => setSaleCard(null)} wide>
          <form onSubmit={handleSaleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={labelSt()}>Produtos</label>
                <button type="button"
                  onClick={() => setSaleItems((p) => [...p, { product_id: products[0]?.id ?? 0, quantity: 1, unit_price: products[0]?.normal_price ?? 0 }])}
                  style={{ fontSize: '11px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  + item
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {saleItems.map((item, i) => {
                  const p = products.find((p) => p.id === item.product_id);
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '7px 10px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {p?.photo_url && <img src={p.photo_url} alt={p.name} style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 2fr 3fr 1fr', gap: 5, alignItems: 'center' }}>
                        <select value={item.product_id} onChange={(e) => updateSaleItem(i, 'product_id', Number(e.target.value))}
                          style={{ ...inputSt(), background: '#18181b' }}>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="number" min={1} value={item.quantity}
                          onChange={(e) => updateSaleItem(i, 'quantity', Number(e.target.value))}
                          style={{ ...inputSt(), textAlign: 'center' }} />
                        <input type="number" step="0.01" min={0} value={item.unit_price}
                          onChange={(e) => updateSaleItem(i, 'unit_price', Number(e.target.value))}
                          style={inputSt()} />
                        <button type="button" disabled={saleItems.length === 1}
                          onClick={() => setSaleItems((p) => p.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', cursor: saleItems.length === 1 ? 'default' : 'pointer', color: '#52525b', display: 'flex', justifyContent: 'center', opacity: saleItems.length === 1 ? 0.2 : 1 }}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
              padding: '9px 12px', background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, marginBottom: 14,
            }}>
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Total</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.02em' }}>{fmt(saleTotal)}</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelSt()}>Observações</label>
              <textarea value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} rows={2}
                placeholder="Tamanho, cor, prazo..."
                style={{ ...inputSt(), resize: 'none' }} />
            </div>

            <p style={{ fontSize: '11px', color: '#52525b', marginBottom: 14 }}>
              O card vai para <span style={{ color: '#fbbf24', fontWeight: 500 }}>Pedido Feito</span> automaticamente.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setSaleCard(null)}
                style={{ padding: '7px 12px', fontSize: '12px', color: '#71717a', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saleSubmitting || !saleCard.customer_id || saleItems.every((i) => !i.product_id)}
                style={{
                  padding: '7px 14px', fontSize: '12px', fontWeight: 500, color: '#fff',
                  background: saleSubmitting ? '#5b21b6' : '#7c3aed',
                  border: 'none', borderRadius: 8,
                  cursor: saleSubmitting ? 'not-allowed' : 'pointer',
                  opacity: saleSubmitting ? 0.7 : 1,
                  letterSpacing: '-0.01em',
                }}>
                {saleSubmitting ? 'Criando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
