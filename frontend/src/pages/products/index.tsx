import { useState, useEffect, useCallback, useRef } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../../utils/api';
import type { Product } from '../../types';

const EMPTY_FORM = { name: '', normal_price: '', photo_url: '' };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: 4 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function inputStyle(focus?: boolean) {
  return {
    width: '100%',
    background: '#18181b',
    border: `1px solid ${focus ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '13px',
    color: '#fafafa',
    outline: 'none',
    transition: 'border-color 0.15s',
  } as React.CSSProperties;
}

function labelStyle() {
  return { display: 'block', fontSize: '12px', fontWeight: 500, color: '#71717a', marginBottom: 6 } as React.CSSProperties;
}

function SkeletonCard() {
  return (
    <div className="skeleton rounded-xl" style={{ height: 200 }} />
  );
}

function ProductCard({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div
      className="rounded-xl overflow-hidden group"
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', height: 140, background: '#18181b', overflow: 'hidden' }}>
        {product.photo_url ? (
          <img
            src={product.photo_url}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#3f3f46" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Actions overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
            padding: 8, gap: 6,
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
          className="group-hover:opacity-100"
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
        >
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em', marginBottom: 2 }}>
          {product.name}
        </p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#a78bfa', letterSpacing: '-0.02em' }}>
          {fmt(product.normal_price)}
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 7, padding: '6px 0', fontSize: '12px', fontWeight: 500,
              color: '#a1a1aa', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)',
              borderRadius: 7, padding: '6px 12px', fontSize: '12px', fontWeight: 500,
              color: '#f87171', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await getProducts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  function openCreate() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setPreviewUrl(null);
    setIsModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setFormData({ name: p.name, normal_price: String(p.normal_price), photo_url: p.photo_url ?? '' });
    setPreviewUrl(p.photo_url ?? null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setPreviewUrl(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setFormData((prev) => ({ ...prev, photo_url: url }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao fazer upload da imagem');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        normal_price: parseFloat(formData.normal_price),
        photo_url: formData.photo_url || null,
      };
      if (editingId !== null) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      closeModal();
      loadProducts();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar produto');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteProduct(id);
      setDeleteConfirmId(null);
      loadProducts();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir produto');
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 3 }}>
            Produtos
          </h1>
          <p style={{ fontSize: '13px', color: '#52525b' }}>
            {loading ? '—' : `${products.length} no catálogo`}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', transition: 'background 0.15s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#6d28d9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Produto
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: '13px', color: '#f87171', marginBottom: 8 }}>{error}</p>
          <button onClick={loadProducts} style={{ fontSize: '13px', color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Tentar novamente
          </button>
        </div>
      ) : products.length === 0 ? (
        <div
          style={{
            textAlign: 'center', padding: '80px 0',
            background: '#111113', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
          }}
        >
          <svg className="w-10 h-10 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="#3f3f46" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#52525b', marginBottom: 4 }}>Nenhum produto ainda</p>
          <p style={{ fontSize: '12px', color: '#3f3f46' }}>Cadastre seu primeiro produto para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={() => openEdit(p)}
              onDelete={() => setDeleteConfirmId(p.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <Modal title={editingId ? 'Editar Produto' : 'Novo Produto'} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            {/* Photo Upload */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle()}>Foto do Produto</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'relative',
                  width: '100%', height: 140,
                  border: '1.5px dashed rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden',
                  transition: 'border-color 0.15s',
                  background: '#18181b',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#7c3aed'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#3f3f46" strokeWidth={1.5} style={{ marginBottom: 8 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p style={{ fontSize: '12px', color: '#52525b' }}>
                      {uploading ? 'Enviando...' : 'Clique para adicionar foto'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#3f3f46', marginTop: 2 }}>JPEG, PNG — máx 5 MB</p>
                  </>
                )}
                {uploading && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(9,9,11,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 22, height: 22,
                      border: '2px solid rgba(124,58,237,0.3)',
                      borderTopColor: '#7c3aed',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  </div>
                )}
                {previewUrl && !uploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewUrl(null);
                      setFormData((f) => ({ ...f, photo_url: '' }));
                    }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(9,9,11,0.8)', border: 'none',
                      borderRadius: '50%', width: 24, height: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#a1a1aa',
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle()}>Nome <span style={{ color: '#f87171' }}>*</span></label>
              <input
                type="text" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Camisa Social Slim"
                style={inputStyle(focusedField === 'name')}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle()}>Preço Base (R$) <span style={{ color: '#f87171' }}>*</span></label>
              <input
                type="number" step="0.01" min="0" required value={formData.normal_price}
                onChange={(e) => setFormData({ ...formData, normal_price: e.target.value })}
                onFocus={() => setFocusedField('price')}
                onBlur={() => setFocusedField(null)}
                placeholder="89.90"
                style={inputStyle(focusedField === 'price')}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button" onClick={closeModal}
                style={{
                  padding: '8px 14px', fontSize: '13px', fontWeight: 500,
                  color: '#71717a', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#71717a'; }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                style={{
                  padding: '8px 16px', fontSize: '13px', fontWeight: 500,
                  color: '#fff', background: submitting || uploading ? '#5b21b6' : '#7c3aed',
                  border: 'none', borderRadius: 8,
                  cursor: submitting || uploading ? 'not-allowed' : 'pointer',
                  opacity: submitting || uploading ? 0.7 : 1,
                  transition: 'background 0.15s',
                  letterSpacing: '-0.01em',
                }}
              >
                {submitting ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirmId !== null && (
        <Modal title="Excluir Produto" onClose={() => setDeleteConfirmId(null)}>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: 20 }}>
            Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={() => setDeleteConfirmId(null)}
              style={{
                padding: '8px 14px', fontSize: '13px', fontWeight: 500,
                color: '#71717a', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(deleteConfirmId)}
              style={{
                padding: '8px 14px', fontSize: '13px', fontWeight: 500,
                color: '#fff', background: '#dc2626',
                border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
