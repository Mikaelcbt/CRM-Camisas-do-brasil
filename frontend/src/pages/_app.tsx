import '../styles/globals.css';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

function AppContent({ Component, pageProps }: AppProps) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const isPublicPage = router.pathname === '/login' || router.pathname === '/register';

  useEffect(() => {
    if (!loading && !session && !isPublicPage) {
      router.replace('/login');
    }
  }, [loading, session, isPublicPage, router]);

  if (loading) {
    return <div style={{ background: '#09090b', height: '100vh' }} />;
  }

  if (isPublicPage) {
    return <Component {...pageProps} />;
  }

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}
