
import os
from supabase import create_client, Client

# Carrega variáveis de ambiente
# Certifique-se de que SUPABASE_URL e SUPABASE_KEY estão definidos no seu .env ou ambiente
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")

supabase: Client = create_client(supabase_url, supabase_key)

def get_supabase_client() -> Client:
    """Retorna o cliente Supabase configurado."""
    return supabase

# Exemplo de como você usaria isso em outro arquivo:
# from .supabase_service import get_supabase_client
# supabase_client = get_supabase_client()
# data, count = supabase_client.from_('your_table').select('*').execute()
