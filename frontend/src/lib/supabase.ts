import { createClient } from '@supabase/supabase-js';

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? '').trim();

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-service-key',
);
