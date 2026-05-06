import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconUsers({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconBag({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconKanban({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function IconList({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

const NAV = [
  { href: '/',          label: 'Home',    Icon: IconHome },
  { href: '/customers', label: 'Clientes', Icon: IconUsers },
  { href: '/orders',    label: 'Vendas',   Icon: IconBag },
  { href: '/kanban',    label: 'Pipeline', Icon: IconKanban },
  { href: '/lists',     label: 'Listas',   Icon: IconList },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#09090b' }}>
      {/* Sidebar — desktop only */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(17,17,19,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div style={{ display: 'flex', height: 56 }}>
          {NAV.map(({ href, label, Icon }) => {
            const isActive = router.pathname === href ||
              (href !== '/' && router.pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  textDecoration: 'none',
                  color: isActive ? '#a78bfa' : '#52525b',
                  transition: 'color 0.15s',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 32,
                    height: 2,
                    background: '#7c3aed',
                    borderRadius: '0 0 4px 4px',
                  }} />
                )}
                <Icon active={isActive} />
                <span style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.01em',
                }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
