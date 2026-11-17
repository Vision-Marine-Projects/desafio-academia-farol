import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a service role: IGNORA a RLS e enxerga o banco inteiro.
 * Só pode ser usado no servidor. Nunca importe este arquivo num componente "use client".
 */
export function criarClienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
