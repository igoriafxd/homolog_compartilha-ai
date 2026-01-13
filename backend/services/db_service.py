# --- Anotações para Iniciantes ---
# Este arquivo contém todas as operações de banco de dados.
# Ele abstrai o Supabase, facilitando manutenção e testes.
# Cada função faz uma operação específica (criar, ler, atualizar, deletar).
# OTIMIZADO: Reduzido N+1 queries usando batch e JOINs

from typing import Optional
from .supabase_client import get_supabase_admin
import logging

logger = logging.getLogger(__name__)

# Usamos o cliente admin para operações do backend
# O RLS será aplicado via user_id nas queries
db = get_supabase_admin()


# ============================================
# PROFILES (Usuários)
# ============================================

def get_profile(user_id: str) -> Optional[dict]:
    """Busca o perfil de um usuário."""
    if not db:
        return None
    result = db.table("profiles").select("*").eq("id", user_id).single().execute()
    return result.data if result.data else None


def update_profile(user_id: str, data: dict) -> Optional[dict]:
    """Atualiza o perfil de um usuário."""
    if not db:
        return None
    result = db.table("profiles").update(data).eq("id", user_id).execute()
    return result.data[0] if result.data else None


# ============================================
# DIVISÕES
# ============================================

def create_divisao(user_id: str, nome: str = "Divisão sem nome", 
                   taxa_servico: float = 10.0, desconto: float = 0.0) -> Optional[dict]:
    """Cria uma nova divisão."""
    if not db:
        return None
    data = {
        "user_id": user_id,
        "nome": nome,
        "taxa_servico_percentual": taxa_servico,
        "desconto_valor": desconto,
        "status": "em_andamento"
    }
    result = db.table("divisoes").insert(data).execute()
    return result.data[0] if result.data else None


def get_divisao(divisao_id: str, user_id: str = None) -> Optional[dict]:
    """Busca uma divisão pelo ID."""
    if not db:
        return None
    query = db.table("divisoes").select("*").eq("id", divisao_id)
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.single().execute()
    return result.data if result.data else None


def get_divisoes_by_user(user_id: str) -> list:
    """Lista todas as divisões de um usuário."""
    if not db:
        return []
    result = db.table("divisoes").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data if result.data else []


def update_divisao(divisao_id: str, data: dict) -> Optional[dict]:
    """Atualiza uma divisão."""
    if not db:
        return None
    result = db.table("divisoes").update(data).eq("id", divisao_id).execute()
    return result.data[0] if result.data else None


def delete_divisao(divisao_id: str) -> bool:
    """Deleta uma divisão."""
    if not db:
        return False
    result = db.table("divisoes").delete().eq("id", divisao_id).execute()
    return len(result.data) > 0 if result.data else False


# ============================================
# ITENS
# ============================================

def create_item(divisao_id: str, nome: str, quantidade: float, valor_unitario: float) -> Optional[dict]:
    """Cria um novo item em uma divisão."""
    if not db:
        return None
    data = {
        "divisao_id": divisao_id,
        "nome": nome,
        "quantidade": quantidade,
        "valor_unitario": valor_unitario
    }
    result = db.table("itens").insert(data).execute()
    return result.data[0] if result.data else None


def create_itens_bulk(itens: list) -> list:
    """Cria vários itens de uma vez."""
    if not db or not itens:
        return []
    result = db.table("itens").insert(itens).execute()
    return result.data if result.data else []


def get_itens_by_divisao(divisao_id: str) -> list:
    """Lista todos os itens de uma divisão."""
    if not db:
        return []
    result = db.table("itens").select("*").eq("divisao_id", divisao_id).order("ordem").execute()
    return result.data if result.data else []


def get_item(item_id: str) -> Optional[dict]:
    """Busca um item pelo ID."""
    if not db:
        return None
    result = db.table("itens").select("*").eq("id", item_id).single().execute()
    return result.data if result.data else None


def update_item(item_id: str, data: dict) -> Optional[dict]:
    """Atualiza um item."""
    if not db:
        return None
    result = db.table("itens").update(data).eq("id", item_id).execute()
    return result.data[0] if result.data else None


def delete_item(item_id: str) -> bool:
    """Deleta um item."""
    if not db:
        return False
    result = db.table("itens").delete().eq("id", item_id).execute()
    return len(result.data) > 0 if result.data else False


# ============================================
# PESSOAS
# ============================================

def create_pessoa(divisao_id: str, nome: str) -> Optional[dict]:
    """Cria uma nova pessoa em uma divisão."""
    if not db:
        return None
    data = {
        "divisao_id": divisao_id,
        "nome": nome
    }
    result = db.table("pessoas").insert(data).execute()
    return result.data[0] if result.data else None


def create_pessoas_bulk(pessoas: list) -> list:
    """Cria várias pessoas de uma vez."""
    if not db or not pessoas:
        return []
    result = db.table("pessoas").insert(pessoas).execute()
    return result.data if result.data else []


def get_pessoas_by_divisao(divisao_id: str) -> list:
    """Lista todas as pessoas de uma divisão."""
    if not db:
        return []
    result = db.table("pessoas").select("*").eq("divisao_id", divisao_id).execute()
    return result.data if result.data else []


def get_pessoa(pessoa_id: str) -> Optional[dict]:
    """Busca uma pessoa pelo ID."""
    if not db:
        return None
    result = db.table("pessoas").select("*").eq("id", pessoa_id).single().execute()
    return result.data if result.data else None


def update_pessoa(pessoa_id: str, data: dict) -> Optional[dict]:
    """Atualiza uma pessoa."""
    if not db:
        return None
    result = db.table("pessoas").update(data).eq("id", pessoa_id).execute()
    return result.data[0] if result.data else None


def delete_pessoa(pessoa_id: str) -> bool:
    """Deleta uma pessoa."""
    if not db:
        return False
    result = db.table("pessoas").delete().eq("id", pessoa_id).execute()
    return len(result.data) > 0 if result.data else False


# ============================================
# ATRIBUIÇÕES
# ============================================

def create_atribuicao(item_id: str, pessoa_id: str, quantidade: float) -> Optional[dict]:
    """Cria uma nova atribuição."""
    if not db:
        return None
    data = {
        "item_id": item_id,
        "pessoa_id": pessoa_id,
        "quantidade": quantidade
    }
    result = db.table("atribuicoes").insert(data).execute()
    return result.data[0] if result.data else None


def upsert_atribuicao(item_id: str, pessoa_id: str, quantidade: float) -> Optional[dict]:
    """Cria ou atualiza uma atribuição."""
    if not db:
        return None
    data = {
        "item_id": item_id,
        "pessoa_id": pessoa_id,
        "quantidade": quantidade
    }
    result = db.table("atribuicoes").upsert(data, on_conflict="item_id,pessoa_id").execute()
    return result.data[0] if result.data else None


def get_atribuicoes_by_item(item_id: str) -> list:
    """Lista todas as atribuições de um item."""
    if not db:
        return []
    result = db.table("atribuicoes").select("*").eq("item_id", item_id).execute()
    return result.data if result.data else []


def get_atribuicoes_by_divisao(divisao_id: str) -> list:
    """Lista todas as atribuições de uma divisão (via itens) - OTIMIZADO com JOIN."""
    if not db:
        return []
    result = db.table("atribuicoes").select("*, itens!inner(divisao_id)").eq("itens.divisao_id", divisao_id).execute()
    return result.data if result.data else []


def delete_atribuicoes_by_item(item_id: str) -> bool:
    """Deleta todas as atribuições de um item."""
    if not db:
        return False
    result = db.table("atribuicoes").delete().eq("item_id", item_id).execute()
    return True


def delete_atribuicao(item_id: str, pessoa_id: str) -> bool:
    """Deleta uma atribuição específica."""
    if not db:
        return False
    result = db.table("atribuicoes").delete().eq("item_id", item_id).eq("pessoa_id", pessoa_id).execute()
    return len(result.data) > 0 if result.data else False


# ============================================
# FUNÇÕES AUXILIARES - OTIMIZADAS
# ============================================

def get_divisao_completa(divisao_id: str) -> Optional[dict]:
    """
    Busca uma divisão com todos os dados relacionados.
    OTIMIZADO: Usa batch query para atribuições ao invés de N+1 queries.
    """
    if not db:
        return None
    
    divisao = get_divisao(divisao_id)
    if not divisao:
        return None
    
    itens = get_itens_by_divisao(divisao_id)
    pessoas = get_pessoas_by_divisao(divisao_id)
    
    # OTIMIZADO: Busca TODAS as atribuições da divisão em UMA query
    todas_atribuicoes = get_atribuicoes_by_divisao(divisao_id)
    
    # Agrupa atribuições por item_id
    atribuicoes_por_item = {}
    for a in todas_atribuicoes:
        item_id = a["item_id"]
        if item_id not in atribuicoes_por_item:
            atribuicoes_por_item[item_id] = []
        atribuicoes_por_item[item_id].append(a)
    
    # Aplica atribuições aos itens
    for item in itens:
        atribuicoes_do_item = atribuicoes_por_item.get(item["id"], [])
        item["atribuido_a"] = {a["pessoa_id"]: a["quantidade"] for a in atribuicoes_do_item}
    
    divisao["itens"] = itens
    divisao["pessoas"] = pessoas
    
    return divisao


def get_divisoes_completas_by_user(user_id: str) -> list:
    """
    Lista todas as divisões de um usuário com dados completos.
    SUPER OTIMIZADO: Usa apenas 4 queries independente do número de divisões.
    
    Antes: 1 + (N divisões * (1 + 1 + M itens)) queries
    Agora: 4 queries sempre (divisões, itens, pessoas, atribuições)
    """
    if not db:
        return []
    
    # Query 1: Busca todas as divisões do usuário
    divisoes = get_divisoes_by_user(user_id)
    if not divisoes:
        return []
    
    divisao_ids = [d["id"] for d in divisoes]
    
    # Query 2: Busca todos os itens de todas as divisões
    itens_result = db.table("itens").select("*").in_("divisao_id", divisao_ids).order("ordem").execute()
    todos_itens = itens_result.data if itens_result.data else []
    
    # Query 3: Busca todas as pessoas de todas as divisões
    pessoas_result = db.table("pessoas").select("*").in_("divisao_id", divisao_ids).execute()
    todas_pessoas = pessoas_result.data if pessoas_result.data else []
    
    # Query 4: Busca todas as atribuições via item_ids
    item_ids = [i["id"] for i in todos_itens]
    if item_ids:
        atrib_result = db.table("atribuicoes").select("*").in_("item_id", item_ids).execute()
        todas_atribuicoes = atrib_result.data if atrib_result.data else []
    else:
        todas_atribuicoes = []
    
    # Agrupa dados por divisao_id
    itens_por_divisao = {}
    for item in todos_itens:
        div_id = item["divisao_id"]
        if div_id not in itens_por_divisao:
            itens_por_divisao[div_id] = []
        itens_por_divisao[div_id].append(item)
    
    pessoas_por_divisao = {}
    for pessoa in todas_pessoas:
        div_id = pessoa["divisao_id"]
        if div_id not in pessoas_por_divisao:
            pessoas_por_divisao[div_id] = []
        pessoas_por_divisao[div_id].append(pessoa)
    
    atribuicoes_por_item = {}
    for a in todas_atribuicoes:
        item_id = a["item_id"]
        if item_id not in atribuicoes_por_item:
            atribuicoes_por_item[item_id] = []
        atribuicoes_por_item[item_id].append(a)
    
    # Monta as divisões completas
    result = []
    for divisao in divisoes:
        div_id = divisao["id"]
        
        # Pega itens dessa divisão
        itens_divisao = itens_por_divisao.get(div_id, [])
        
        # Aplica atribuições aos itens
        for item in itens_divisao:
            atribs = atribuicoes_por_item.get(item["id"], [])
            item["atribuido_a"] = {a["pessoa_id"]: a["quantidade"] for a in atribs}
        
        divisao["itens"] = itens_divisao
        divisao["pessoas"] = pessoas_por_divisao.get(div_id, [])
        
        result.append(divisao)
    
    return result