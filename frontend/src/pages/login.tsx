import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabaseBrowser } from '../lib/supabase-browser';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace('/');
    }
  }, [loading, session, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('not confirmed') || authError.message.toLowerCase().includes('email')) {
        setError('Confirme seu email antes de entrar. Verifique sua caixa de entrada (e spam).');
      } else {
        setError('Email ou senha incorretos.');
      }
      setSubmitting(false);
    } else {
      router.replace('/');
    }
  }

  if (loading || session) {
    return <div style={{ background: '#09090b', height: '100vh' }} />;
  }

  return (
    <div
      style={{
        background: '#09090b',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.02em' }}>C</span>
          </div>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0 }}>
              CRM Camisas
            </p>
            <p style={{ fontSize: '12px', color: '#52525b', margin: 0 }}>Vendas</p>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#111113',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '32px',
          }}
        >
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#fafafa',
              letterSpacing: '-0.03em',
              marginBottom: '6px',
            }}
          >
            Entrar
          </h1>
          <p style={{ fontSize: '13px', color: '#52525b', marginBottom: '28px' }}>
            Acesse com sua conta
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', letterSpacing: '0.01em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                style={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#fafafa',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', letterSpacing: '0.01em' }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#fafafa',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                border: 'none',
                borderRadius: '8px',
                padding: '11px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                width: '100%',
                marginTop: '4px',
                letterSpacing: '-0.01em',
                transition: 'opacity 0.15s',
              }}
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ fontSize: '12px', color: '#52525b', marginTop: '20px', textAlign: 'center' }}>
            Não tem conta?{' '}
            <Link href="/register" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
