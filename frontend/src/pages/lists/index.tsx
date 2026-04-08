import { useState, useEffect, useCallback } from 'react';
import {
  getOrderLists, createOrderList, deleteOrderList,
  getOrderList, addListEntry, deleteListEntry, confirmOrderList,
  getCustomers, getProducts,
} from '../../utils/api';
import type { OrderList, OrderListDetail, ListEntry, Customer, Product } from '../../types';

// ── Primitives ────────────────────────────────────────────────────────────────

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
        borderRadius: 16, width: '100%', maxWidth: wide ? 560 : 440,
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
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

const inputSt = (focused = false): React.CSSProperties => ({
  width: '100%', background: '#18181b',
  border: `1px solid ${focused ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 8, padding: '8px 12px',
  fontSize: '13px', color: '#fafafa', outline: 'none',
  transition: 'border-color 0.15s',
});

const labelSt = (): React.CSSProperties => ({
  display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717a', marginBottom: 6,
});

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function StatusBadge({ status }: { status: 'draft' | 'confirmed' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: '10px', fontWeight: 600,
      background: status === 'confirmed' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
      color: status === 'confirmed' ? '#34d399' : '#fbbf24',
      border: `1px solid ${status === 'confirmed' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {status === 'confirmed' ? 'Confirmada' : 'Rascunho'}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Lists() {
  const [lists, setLists] = useState<OrderList[]>([]);
  const [selectedList, setSelectedList] = useState<OrderListDetail | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deletingListId, setDeletingListId] = useState<number | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);

  // Create list modal
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListNotes, setNewListNotes] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  // Add entry modal
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [entryItems, setEntryItems] = useState<Array<{ _key: number; product_id: number; product_name: string; quantity: number; unit_price: number }>>([]);
  const [addingEntry, setAddingEntry] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  // Confirm success
  const [confirmResult, setConfirmResult] = useState<{ orders_created: number } | null>(null);

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    try { setLists(await getOrderLists()); }
    catch (e) { console.error(e); }
    finally { setLoadingLists(false); }
  }, []);

  useEffect(() => {
    loadLists();
    getCustomers().then(setCustomers).catch(console.error);
    getProducts().then(setProducts).catch(console.error);
  }, [loadLists]);

  async function openList(id: number) {
    setLoadingDetail(true);
    setSelectedList(null);
    try { setSelectedList(await getOrderList(id)); }
    catch (e) { console.error(e); }
    finally { setLoadingDetail(false); }
  }

  // ── Create list ────────────────────────────────────────────────────────────
  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreatingList(true);
    try {
      const list = await createOrderList({ name: newListName.trim(), notes: newListNotes.trim() || undefined });
      setLists((prev) => [list, ...prev]);
      setIsCreateListOpen(false);
      setNewListName(''); setNewListNotes('');
      openList(list.id);
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro'); }
    finally { setCreatingList(false); }
  }

  // ── Delete list ────────────────────────────────────────────────────────────
  async function handleDeleteList(id: number) {
    setDeletingListId(id);
    try {
      await deleteOrderList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));
      if (selectedList?.id === id) setSelectedList(null);
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro'); }
    finally { setDeletingListId(null); }
  }

  // ── Add entry ──────────────────────────────────────────────────────────────
  function openAddEntry() {
    const firstProduct = products[0];
    setEntryMode('existing');
    setSelectedCustomerId('');
    setNewName(''); setNewPhone(''); setNewEmail(''); setEntryNotes('');
    setEntryItems(firstProduct
      ? [{ _key: Date.now(), product_id: firstProduct.id, product_name: firstProduct.name, quantity: 1, unit_price: firstProduct.normal_price }]
      : []
    );
    setIsAddEntryOpen(true);
  }

  function addEntryItem() {
    const p = products[0];
    if (!p) return;
    setEntryItems((prev) => [...prev, { _key: Date.now(), product_id: p.id, product_name: p.name, quantity: 1, unit_price: p.normal_price }]);
  }

  function updateEntryItem(key: number, field: string, value: number | string) {
    setEntryItems((prev) => prev.map((item) => {
      if (item._key !== key) return item;
      const next = { ...item, [field]: value };
      if (field === 'product_id') {
        const p = products.find((p) => p.id === Number(value));
        if (p) { next.unit_price = p.normal_price; next.product_name = p.name; }
      }
      return next;
    }));
  }

  const entryTotal = entryItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedList) return;
    setAddingEntry(true);
    try {
      let customerName = '';
      let phone: string | undefined;
      let email: string | undefined;
      let customerId: number | undefined;

      if (entryMode === 'existing') {
        const c = customers.find((c) => c.id === Number(selectedCustomerId));
        if (!c) throw new Error('Selecione um cliente');
        customerName = c.full_name;
        phone = c.phone;
        customerId = c.id;
      } else {
        if (!newName.trim() || !newPhone.trim()) throw new Error('Nome e telefone são obrigatórios');
        customerName = newName.trim();
        phone = newPhone.trim();
        email = newEmail.trim() || undefined;
      }

      const entry = await addListEntry(selectedList.id, {
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: phone,
        email,
        notes: entryNotes.trim() || undefined,
        products: entryItems.map(({ _key: _, ...rest }) => rest),
      });

      // Update selected list state
      setSelectedList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: [...prev.entries, entry as ListEntry],
          entry_count: prev.entry_count + 1,
          total: prev.total + (entry as ListEntry).total,
        };
      });

      // Update list in sidebar
      const entryTyped = entry as ListEntry;
      setLists((prev) => prev.map((l) =>
        l.id === selectedList.id
          ? { ...l, entry_count: l.entry_count + 1, total: l.total + entryTyped.total }
          : l
      ));

      setIsAddEntryOpen(false);

      // If new customer, reload customer list
      if (entryMode === 'new') {
        getCustomers().then(setCustomers).catch(console.error);
      }
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao adicionar entrada'); }
    finally { setAddingEntry(false); }
  }

  // ── Delete entry ───────────────────────────────────────────────────────────
  async function handleDeleteEntry(entry: ListEntry) {
    if (!selectedList) return;
    setDeletingEntryId(entry.id);
    try {
      await deleteListEntry(selectedList.id, entry.id);
      setSelectedList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          entries: prev.entries.filter((e) => e.id !== entry.id),
          entry_count: prev.entry_count - 1,
          total: prev.total - entry.total,
        };
      });
      setLists((prev) => prev.map((l) =>
        l.id === selectedList.id
          ? { ...l, entry_count: l.entry_count - 1, total: l.total - entry.total }
          : l
      ));
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro'); }
    finally { setDeletingEntryId(null); }
  }

  // ── Confirm list ───────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!selectedList) return;
    setConfirming(true);
    try {
      const result = await confirmOrderList(selectedList.id);
      setConfirmResult(result);
      setSelectedList((prev) => prev ? { ...prev, status: 'confirmed', entries: prev.entries.map((e) => ({ ...e, order_id: e.order_id ?? -1 })) } : prev);
      setLists((prev) => prev.map((l) => l.id === selectedList.id ? { ...l, status: 'confirmed' } : l));
      setTimeout(() => setConfirmResult(null), 4000);
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao confirmar'); }
    finally { setConfirming(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const SkeletonRow = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="skeleton rounded" style={{ height: 13, width: 140 }} />
      <div className="skeleton rounded" style={{ height: 11, width: 80 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 64px)' }}>
      {/* ── Left pane: list of lists ─────────────────────────────────────── */}
      <div style={{
        width: 280, flexShrink: 0,
        background: '#111113', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fafafa' }}>Listas</p>
            <p style={{ fontSize: '11px', color: '#52525b', marginTop: 1 }}>
              {loadingLists ? '—' : `${lists.length} ${lists.length === 1 ? 'lista' : 'listas'}`}
            </p>
          </div>
          <button
            onClick={() => setIsCreateListOpen(true)}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 7,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
            title="Nova Lista"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* List items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingLists ? (
            <>{[1, 2, 3].map((i) => <SkeletonRow key={i} />)}</>
          ) : lists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <svg className="w-8 h-8 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="#3f3f46" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ fontSize: '12px', color: '#3f3f46' }}>Nenhuma lista ainda</p>
            </div>
          ) : lists.map((list) => {
            const isSelected = selectedList?.id === list.id;
            return (
              <div
                key={list.id}
                onClick={() => openList(list.id)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(124,58,237,0.1)' : 'transparent',
                  borderLeft: `2px solid ${isSelected ? '#7c3aed' : 'transparent'}`,
                  transition: 'background 0.1s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {list.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatusBadge status={list.status} />
                      <span style={{ fontSize: '11px', color: '#52525b' }}>{list.entry_count} cliente{list.entry_count !== 1 ? 's' : ''}</span>
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#a78bfa', letterSpacing: '-0.01em', marginTop: 4 }}>
                      {fmt(list.total)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                    disabled={deletingListId === list.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f46', display: 'flex', padding: 4, transition: 'color 0.15s', flexShrink: 0, opacity: deletingListId === list.id ? 0.4 : 1 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46'; }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <p style={{ fontSize: '10px', color: '#3f3f46', marginTop: 4 }}>
                  {new Date(list.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right pane: selected list detail ─────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {loadingDetail ? (
          <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24 }}>
            <div className="skeleton rounded" style={{ height: 22, width: 200, marginBottom: 12 }} />
            <div className="skeleton rounded" style={{ height: 14, width: 120, marginBottom: 24 }} />
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div className="skeleton rounded" style={{ height: 14, flex: 2 }} />
                <div className="skeleton rounded" style={{ height: 14, flex: 3 }} />
                <div className="skeleton rounded" style={{ height: 14, flex: 1 }} />
              </div>
            ))}
          </div>
        ) : !selectedList ? (
          <div style={{
            background: '#111113', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="#27272a" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#52525b', marginBottom: 6 }}>Nenhuma lista selecionada</p>
            <p style={{ fontSize: '12px', color: '#3f3f46' }}>Selecione uma lista ou crie uma nova</p>
          </div>
        ) : (
          <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Detail header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', margin: 0 }}>
                    {selectedList.name}
                  </h2>
                  <StatusBadge status={selectedList.status} />
                </div>
                <p style={{ fontSize: '12px', color: '#52525b' }}>
                  {selectedList.entry_count} cliente{selectedList.entry_count !== 1 ? 's' : ''}
                  {' · '}
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>{fmt(selectedList.total)}</span>
                  {selectedList.notes && ` · ${selectedList.notes}`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Confirm result toast */}
                {confirmResult && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: 8, padding: '6px 12px',
                    fontSize: '12px', color: '#34d399', fontWeight: 500,
                  }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {confirmResult.orders_created} {confirmResult.orders_created === 1 ? 'pedido criado' : 'pedidos criados'}
                  </div>
                )}

                {selectedList.status === 'draft' && (
                  <>
                    <button
                      onClick={openAddEntry}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,255,255,0.04)', color: '#a1a1aa',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                        padding: '7px 12px', fontSize: '13px', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar
                    </button>

                    <button
                      onClick={handleConfirm}
                      disabled={confirming || selectedList.entry_count === 0}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: confirming || selectedList.entry_count === 0 ? '#5b21b6' : '#7c3aed',
                        color: '#fff', border: 'none', borderRadius: 8,
                        padding: '7px 14px', fontSize: '13px', fontWeight: 500,
                        cursor: confirming || selectedList.entry_count === 0 ? 'not-allowed' : 'pointer',
                        opacity: confirming || selectedList.entry_count === 0 ? 0.6 : 1,
                        transition: 'background 0.15s', letterSpacing: '-0.01em',
                      }}
                      onMouseEnter={(e) => { if (!confirming && selectedList.entry_count > 0) (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
                      onMouseLeave={(e) => { if (!confirming && selectedList.entry_count > 0) (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
                    >
                      {confirming ? (
                        <>
                          <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Confirmar Lista
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Entries table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {selectedList.entries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <svg className="w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="#27272a" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#52525b', marginBottom: 4 }}>Lista vazia</p>
                  <p style={{ fontSize: '12px', color: '#3f3f46' }}>Clique em "Adicionar" para incluir clientes nesta lista</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      {['Cliente', 'Produtos', 'Total', 'Status', ''].map((h) => (
                        <th key={h} style={{
                          padding: '10px 16px', textAlign: 'left',
                          fontSize: '11px', fontWeight: 600, color: '#52525b',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedList.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em', marginBottom: 2 }}>
                            {entry.customer_name}
                          </p>
                          {entry.customer_phone && (
                            <p style={{ fontSize: '11px', color: '#52525b' }}>{entry.customer_phone}</p>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {entry.products.map((p) => (
                              <span key={p.id} style={{ fontSize: '12px', color: '#a1a1aa' }}>
                                {p.quantity}× {p.product_name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>
                          {fmt(entry.total)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {entry.order_id ? (
                            <span style={{
                              fontSize: '11px', fontWeight: 500,
                              color: '#34d399', background: 'rgba(52,211,153,0.1)',
                              border: '1px solid rgba(52,211,153,0.2)',
                              borderRadius: 20, padding: '2px 8px',
                            }}>
                              Pedido #{entry.order_id}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px', fontWeight: 500,
                              color: '#71717a', background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 20, padding: '2px 8px',
                            }}>
                              Aguardando
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {!entry.order_id && selectedList.status === 'draft' && (
                            <button
                              onClick={() => handleDeleteEntry(entry)}
                              disabled={deletingEntryId === entry.id}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f46', display: 'flex', padding: 4, transition: 'color 0.15s', opacity: deletingEntryId === entry.id ? 0.4 : 1 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3f3f46'; }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Create list modal ─────────────────────────────────────────────── */}
      {isCreateListOpen && (
        <Modal title="Nova Lista de Pedidos" onClose={() => setIsCreateListOpen(false)}>
          <form onSubmit={handleCreateList}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt()}>Nome da lista <span style={{ color: '#f87171' }}>*</span></label>
              <input
                autoFocus type="text" required value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onFocus={() => setFocused('lname')} onBlur={() => setFocused(null)}
                style={inputSt(focused === 'lname')}
                placeholder="Pedidos Feira Abril, Turma X..."
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelSt()}>Observações</label>
              <textarea
                value={newListNotes}
                onChange={(e) => setNewListNotes(e.target.value)}
                onFocus={() => setFocused('lnotes')} onBlur={() => setFocused(null)}
                rows={2} placeholder="Contexto da lista..."
                style={{ ...inputSt(focused === 'lnotes'), resize: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setIsCreateListOpen(false)}
                style={{ padding: '8px 14px', fontSize: '13px', color: '#71717a', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={creatingList || !newListName.trim()}
                style={{
                  padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff',
                  background: creatingList ? '#5b21b6' : '#7c3aed', border: 'none', borderRadius: 8,
                  cursor: creatingList ? 'not-allowed' : 'pointer', opacity: creatingList ? 0.7 : 1,
                  letterSpacing: '-0.01em',
                }}>
                {creatingList ? 'Criando...' : 'Criar Lista'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Add entry modal ───────────────────────────────────────────────── */}
      {isAddEntryOpen && (
        <Modal title="Adicionar à Lista" onClose={() => setIsAddEntryOpen(false)} wide>
          <form onSubmit={handleAddEntry}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, marginBottom: 18, gap: 2 }}>
              {(['existing', 'new'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEntryMode(mode)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 6,
                    fontSize: '12px', fontWeight: 500,
                    background: entryMode === mode ? '#7c3aed' : 'transparent',
                    color: entryMode === mode ? '#fff' : '#71717a',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {mode === 'existing' ? 'Cliente Cadastrado' : 'Novo Cliente'}
                </button>
              ))}
            </div>

            {/* Customer section */}
            {entryMode === 'existing' ? (
              <div style={{ marginBottom: 16 }}>
                <label style={labelSt()}>Cliente <span style={{ color: '#f87171' }}>*</span></label>
                <select
                  required value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(Number(e.target.value));
                    const c = customers.find((c) => c.id === Number(e.target.value));
                    if (c) setNewPhone(c.phone);
                  }}
                  onFocus={() => setFocused('cust')} onBlur={() => setFocused(null)}
                  style={{ ...inputSt(focused === 'cust'), background: '#18181b' }}
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelSt()}>Nome <span style={{ color: '#f87171' }}>*</span></label>
                  <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                    onFocus={() => setFocused('nname')} onBlur={() => setFocused(null)}
                    style={inputSt(focused === 'nname')} placeholder="Maria Silva" />
                </div>
                <div>
                  <label style={labelSt()}>Telefone <span style={{ color: '#f87171' }}>*</span></label>
                  <input type="tel" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                    onFocus={() => setFocused('nphone')} onBlur={() => setFocused(null)}
                    style={inputSt(focused === 'nphone')} placeholder="(11) 99999-9999" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelSt()}>E-mail</label>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                    onFocus={() => setFocused('nemail')} onBlur={() => setFocused(null)}
                    style={inputSt(focused === 'nemail')} placeholder="maria@email.com" />
                </div>
              </div>
            )}

            {/* Products */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={labelSt()}>Produtos <span style={{ color: '#f87171' }}>*</span></label>
                <button type="button" onClick={addEntryItem}
                  style={{ fontSize: '12px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  + item
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {entryItems.map((item) => {
                  const p = products.find((p) => p.id === item.product_id);
                  return (
                    <div key={item._key} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {p?.photo_url && (
                        <img src={p.photo_url} alt={p.name} style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 2fr 3fr 1fr', gap: 6, alignItems: 'center' }}>
                        <select
                          value={item.product_id}
                          onChange={(e) => updateEntryItem(item._key, 'product_id', Number(e.target.value))}
                          style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px', background: '#18181b' }}
                        >
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="number" min={1} value={item.quantity}
                          onChange={(e) => updateEntryItem(item._key, 'quantity', Number(e.target.value))}
                          style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px', textAlign: 'center' }} />
                        <input type="number" step="0.01" min={0} value={item.unit_price}
                          onChange={(e) => updateEntryItem(item._key, 'unit_price', Number(e.target.value))}
                          style={{ ...inputSt(), padding: '5px 8px', fontSize: '12px' }} />
                        <button type="button" onClick={() => setEntryItems((prev) => prev.filter((i) => i._key !== item._key))}
                          disabled={entryItems.length === 1}
                          style={{ background: 'none', border: 'none', cursor: entryItems.length === 1 ? 'default' : 'pointer', color: '#52525b', display: 'flex', justifyContent: 'center', opacity: entryItems.length === 1 ? 0.2 : 1 }}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {products.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#52525b', textAlign: 'center', padding: '12px 0' }}>
                    Cadastre produtos primeiro para adicionar itens.
                  </p>
                )}
              </div>
            </div>

            {entryItems.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, marginBottom: 16,
              }}>
                <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Total desta entrada</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.02em' }}>{fmt(entryTotal)}</span>
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelSt()}>Observações</label>
              <input type="text" value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)}
                onFocus={() => setFocused('enotes')} onBlur={() => setFocused(null)}
                style={inputSt(focused === 'enotes')} placeholder="Tamanho, cor..." />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" onClick={() => setIsAddEntryOpen(false)}
                style={{ padding: '8px 14px', fontSize: '13px', color: '#71717a', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={addingEntry || entryItems.length === 0 || (entryMode === 'existing' && !selectedCustomerId)}
                style={{
                  padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: '#fff',
                  background: addingEntry ? '#5b21b6' : '#7c3aed', border: 'none', borderRadius: 8,
                  cursor: addingEntry ? 'not-allowed' : 'pointer', opacity: addingEntry ? 0.7 : 1,
                  letterSpacing: '-0.01em',
                }}>
                {addingEntry ? 'Adicionando...' : 'Adicionar à Lista'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
