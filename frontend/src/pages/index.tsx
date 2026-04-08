import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getDashboardStats } from '../utils/api';
import type { DashboardStats, PendingOrderRow } from '../types';

function SkeletonCard() {
  return (
    <div className="skeleton rounded-xl" style={{ height: 96 }} />
  );
}

function StatCard({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717a', marginBottom: 6 }}>{title}</p>
      <p
        style={{
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: accent ? '#a78bfa' : '#fafafa',
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '11px', color: '#52525b', marginTop: 4 }}>{sub}</p>
      )}
    </div>
  );
}

const quickLinks = [
  { label: 'Novo Cliente',  href: '/customers', bg: 'rgba(124,58,237,0.12)', color: '#a78bfa', hoverBg: 'rgba(124,58,237,0.2)' },
  { label: 'Novo Produto',  href: '/products',  bg: 'rgba(14,165,233,0.08)', color: '#38bdf8', hoverBg: 'rgba(14,165,233,0.14)' },
  { label: 'Nova Venda',    href: '/orders',    bg: 'rgba(52,211,153,0.08)', color: '#34d399', hoverBg: 'rgba(52,211,153,0.14)' },
  { label: 'Ver Pipeline',  href: '/kanban',    bg: 'rgba(251,191,36,0.08)', color: '#fbbf24', hoverBg: 'rgba(251,191,36,0.14)' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', color: '#fafafa', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: '#52525b' }}>Visão geral do negócio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3" style={{ marginBottom: 28 }}>
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <StatCard
              title="Clientes"
              value={String(stats?.total_customers ?? 0)}
              sub="cadastrados"
            />
            <StatCard
              title="Produtos"
              value={String(stats?.total_products ?? 0)}
              sub="no catálogo"
            />
            <StatCard
              title="Receita do Mês"
              value={fmt(stats?.monthly_revenue ?? 0)}
              sub={`${stats?.monthly_orders ?? 0} pedidos pagos`}
              accent
            />
            <StatCard
              title="A Receber"
              value={fmt(stats?.pending_value ?? 0)}
              sub={`${stats?.pending_orders ?? 0} pendentes`}
            />
          </>
        )}
      </div>

      {/* Pending orders table */}
      {!loading && (stats?.pending_list?.length ?? 0) > 0 && (
        <div
          className="rounded-xl"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 28 }}
        >
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pedidos Pendentes
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Cliente', 'Data', 'Valor'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 20px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#52525b',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.pending_list ?? []).map((row: PendingOrderRow, i: number) => (
                  <tr
                    key={row.id}
                    style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td style={{ padding: '10px 20px', fontSize: '12px', color: '#52525b', fontVariantNumeric: 'tabular-nums' }}>
                      #{row.id}
                    </td>
                    <td style={{ padding: '10px 20px', fontSize: '13px', color: '#d4d4d8', fontWeight: 500 }}>
                      {row.customer_name}
                    </td>
                    <td style={{ padding: '10px 20px', fontSize: '12px', color: '#71717a', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(row.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '10px 20px', fontSize: '13px', color: '#fbbf24', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div
        className="rounded-xl p-5"
        style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
          Acesso rápido
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickLinks.map(({ label, href, bg, color, hoverBg }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              style={{
                background: bg,
                color,
                border: 'none',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
