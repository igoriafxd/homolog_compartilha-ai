# --- Anotações para Iniciantes ---
# Este arquivo configura a conexão com o Supabase.
# O Supabase é nosso banco de dados e sistema de autenticação.
# Exportamos o cliente 'supabase' para ser usado em outros arquivos.

import os
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

# Configura logging
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Pega as credenciais do .env
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Valida se as credenciais existem
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    logger.warning("⚠️ Credenciais do Supabase não configuradas. Algumas funcionalidades não vão funcionar.")
    supabase: Client | None = None
    supabase_admin: Client | None = None
else:
    # Cliente normal (respeita RLS - Row Level Security)
    # Use este para operações de usuários logados
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Cliente admin (bypassa RLS)
    # Use este APENAS para operações administrativas ou testes
    if SUPABASE_SERVICE_KEY:
        supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    else:
        supabase_admin = None
    
    logger.info(f"✅ Supabase conectado: {SUPABASE_URL[:30]}...")


def get_supabase() -> Client | None:
    """Retorna o cliente do Supabase (com RLS)."""
    return supabase


def get_supabase_admin() -> Client | None:
    """Retorna o cliente admin do Supabase (sem RLS). Use com cuidado!"""
    return supabase_admin