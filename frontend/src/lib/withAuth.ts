import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const supabaseAuth = createServerSupabaseClient({ req, res });
      const { data: { session } } = await supabaseAuth.auth.getSession();
      if (!session) return res.status(401).json({ detail: 'Não autenticado' });
    } catch {
      return res.status(401).json({ detail: 'Não autenticado' });
    }
    return handler(req, res);
  };
}
