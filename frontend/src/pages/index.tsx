import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getDashboardStats } from '../utils/api';
import type { DashboardStats } from '../types';

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
              sub={`${stats?.monthly_orders ?? 0} pedidos`}
              accent
            />
            <StatCard
              title="Pendentes"
              value={String(stats?.pending_orders ?? 0)}
              sub="aguardando pagamento"
            />
          </>
        )}
      </div>

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
