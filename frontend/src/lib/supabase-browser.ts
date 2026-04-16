import { createClient } from '@supabase/supabase-js';

// Fallback prevents createClient from throwing during `next build` when env vars
// are absent (e.g. first Vercel deployment before variables are configured).
// The real values are inlined at build time via NEXT_PUBLIC_* — set them in Vercel.
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim() || 'https://placeholder.supabase.co';
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim() || 'placeholder-anon-key';

export const supabaseBrowser = createClient(url, key);
