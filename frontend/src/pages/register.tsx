import React, { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabaseBrowser } from '../lib/supabase-browser';
import { useAuth } from '../contexts/AuthContext';

const inputStyle: React.CSSProperties = {
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
};

export default function RegisterPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace('/');
    }
  }, [loading, session, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }

    setSubmitting(true);

    const { error: authError } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() || email.split('@')[0] },
      },
    });

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Este email já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.');
      setSubmitting(false);
    } else {
      setSuccess(true);
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
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                Conta criada!
              </h2>
              <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '24px', lineHeight: 1.5 }}>
                Verifique seu email para confirmar o cadastro e depois faça login.
              </p>
              <Link
                href="/login"
                style={{
                  display: 'block',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  borderRadius: '8px',
                  padding: '11px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  textDecoration: 'none',
                  textAlign: 'center',
                  letterSpacing: '-0.01em',
                }}
              >
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#fafafa',
                  letterSpacing: '-0.03em',
                  marginBottom: '6px',
                }}
              >
                Criar conta
              </h1>
              <p style={{ fontSize: '13px', color: '#52525b', marginBottom: '28px' }}>
                Preencha os dados para se cadastrar
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', letterSpacing: '0.01em' }}>
                    Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>

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
                    style={inputStyle}
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
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', letterSpacing: '0.01em' }}>
                    Confirmar senha
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    autoComplete="new-password"
                    style={inputStyle}
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
                  }}
                >
                  {submitting ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>

              <p style={{ fontSize: '12px', color: '#52525b', marginTop: '20px', textAlign: 'center' }}>
                Já tem conta?{' '}
                <Link href="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
