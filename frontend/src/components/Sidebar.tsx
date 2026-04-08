import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface NavLink {
  name: string;
  href: string;
  icon: React.ReactNode;
}

function IconDashboard() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function IconShoppingBag() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconKanban() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function IconList() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  const links: NavLink[] = [
    { name: 'Dashboard',  href: '/',          icon: <IconDashboard /> },
    { name: 'Clientes',   href: '/customers', icon: <IconUsers /> },
    { name: 'Produtos',   href: '/products',  icon: <IconBox /> },
    { name: 'Vendas',     href: '/orders',    icon: <IconShoppingBag /> },
    { name: 'Pipeline',   href: '/kanban',    icon: <IconKanban /> },
    { name: 'Listas',     href: '/lists',     icon: <IconList /> },
  ];

  return (
    <aside
      className="w-56 h-screen flex flex-col shrink-0"
      style={{
        background: '#111113',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        className="px-4 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.02em' }}>C</span>
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              CRM Camisas
            </p>
            <p style={{ fontSize: '11px', color: '#52525b', lineHeight: 1.4 }}>Vendas</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3">
        <p style={{ padding: '4px 8px 8px', fontSize: '10px', fontWeight: 600, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Menu
        </p>
        {links.map((link) => {
          const isActive = router.pathname === link.href ||
            (link.href !== '/' && router.pathname.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#fafafa' : '#71717a',
                background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                marginBottom: '1px',
                transition: 'all 0.15s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#a1a1aa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#71717a';
                }
              }}
            >
              <span style={{ color: isActive ? '#a78bfa' : '#52525b', display: 'flex', alignItems: 'center' }}>
                {link.icon}
              </span>
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 6px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
              {displayName.charAt(0)}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#d4d4d8', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </p>
            <p style={{ fontSize: '10px', color: '#52525b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 400,
            color: '#71717a',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#71717a';
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <IconLogout />
          </span>
          Sair
        </button>
      </div>
    </aside>
  );
}
