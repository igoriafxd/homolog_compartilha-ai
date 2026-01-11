// Conecta o frontend ao Supabase usando as variáveis de ambiente
// Usa apenas a ANON_KEY (chave pública, segura para o frontend)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis do Supabase não configuradas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;