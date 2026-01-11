# backend/services/auth.py
# Autenticação usando Supabase para validar tokens JWT

import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Token de API legado (para desenvolvimento/compatibilidade)
API_SECRET_TOKEN = os.getenv("API_SECRET_TOKEN")

# Esquemas de autenticação
bearer_scheme = HTTPBearer(auto_error=False)
api_key_scheme = APIKeyHeader(name="x-api-key", auto_error=False)

# Cliente Supabase para validar tokens
from .supabase_client import supabase_admin


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    api_key: str = Depends(api_key_scheme),
) -> dict:
    """
    Verifica a autenticação e retorna os dados do usuário.
    
    Usa o Supabase para validar o token JWT.
    """
    
    # Tenta autenticação por Bearer token (Supabase JWT)
    if credentials and credentials.credentials:
        token = credentials.credentials
        
        try:
            # Usa o Supabase Admin para validar o token e pegar o usuário
            user_response = supabase_admin.auth.get_user(token)
            
            if user_response and user_response.user:
                user = user_response.user
                logger.info(f"Usuário autenticado via JWT: {user.id[:8]}...")
                return {
                    "user_id": user.id,
                    "email": user.email,
                    "method": "jwt",
                }
        except Exception as e:
            logger.warning(f"Token JWT inválido: {e}")
    
    # Fallback: Tenta autenticação por API Key (desenvolvimento)
    if api_key:
        if API_SECRET_TOKEN and api_key == API_SECRET_TOKEN:
            logger.info("Autenticado via API Key (modo desenvolvimento)")
            # Em modo API Key, não temos user_id
            return {
                "user_id": None,
                "email": None,
                "method": "api_key",
            }
    
    # Se nenhum método funcionou, permite acesso sem autenticação em dev
    if not API_SECRET_TOKEN:
        logger.warning("⚠️ Rodando SEM autenticação (modo desenvolvimento)")
        return {
            "user_id": None,
            "email": None,
            "method": "none",
        }
    
    # Se chegou aqui, a autenticação falhou
    raise HTTPException(
        status_code=401,
        detail="Token de autenticação inválido ou ausente",
        headers={"WWW-Authenticate": "Bearer"},
    )