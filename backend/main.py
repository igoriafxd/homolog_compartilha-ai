# --- Anotações para Iniciantes ---
# Este arquivo é o "coração" do nosso backend.
# ATUALIZADO: Agora usando Supabase para persistência de dados!

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import uuid
from dotenv import load_dotenv
import logging

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Carrega .env da mesma pasta do main.py (backend/)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Verifica se o token foi configurado
API_SECRET_TOKEN = os.getenv("API_SECRET_TOKEN")
if API_SECRET_TOKEN:
    logger.info(f"✅ Token carregado: {API_SECRET_TOKEN[:8]}...")
else:
    logger.warning("⚠️ Rodando SEM autenticação (modo desenvolvimento)")

# --- Importações do nosso próprio projeto ---
from .services.ia_scanner import scan_receipt_to_json
from .services import db_service as db
from .schemas import (
    Item, ScanResponse, Pessoa, Divisao, DistribuirItemRequest, TotaisResponse,
    PessoaTotal, ItemConsumido, Progresso, ItemPayload, ConfigDivisao, AddPessoaRequest
)

# --- Configuração da Aplicação FastAPI ---
app = FastAPI(
    title="Compartilha AI API",
    description="API para escanear e dividir contas de restaurante.",
    version="3.0.0"  # Versão atualizada com Supabase
)

# Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://192.168.1.104:5173",
        "https://compartilha-ai.vercel.app",
        "https://www.iafxd.com",
        "https://iafxd.com",
        "https://www.iafxd.com/",
        "https://iafxd.com/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de Segurança
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

class CustomSecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response

app.add_middleware(CustomSecurityHeadersMiddleware)

# --- Esquema e Função de Autenticação ---
api_key_scheme = APIKeyHeader(name="x-api-key", auto_error=False)

async def verify_api_key(x_api_key: Optional[str] = Depends(api_key_scheme)):
    """Verifica se o token de API enviado no header é válido."""
    if not API_SECRET_TOKEN:
        return None
    if not x_api_key or x_api_key != API_SECRET_TOKEN:
        raise HTTPException(status_code=403, detail="🔒 Token de API inválido ou ausente")
    return x_api_key

# --- Constantes ---
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# ID de usuário temporário para desenvolvimento (até implementar auth completa)
DEV_USER_ID = "00000000-0000-0000-0000-000000000001"


# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def db_divisao_to_response(divisao_db: dict) -> Divisao:
    """Converte dados do banco para o modelo de resposta."""
    itens = divisao_db.get("itens", [])
    pessoas = divisao_db.get("pessoas", [])
    
    return Divisao(
        id=divisao_db["id"],
        itens=[
            Item(
                id=item["id"],
                nome=item["nome"],
                quantidade=float(item["quantidade"]),
                valor_unitario=float(item["valor_unitario"]),
                atribuido_a=item.get("atribuido_a", {})
            ) for item in itens
        ],
        pessoas=[
            Pessoa(id=p["id"], nome=p["nome"]) for p in pessoas
        ],
        status=divisao_db.get("status", "em_andamento"),
        taxa_servico_percentual=float(divisao_db.get("taxa_servico_percentual", 10.0)),
        desconto_valor=float(divisao_db.get("desconto_valor", 0.0))
    )


# ============================================
# ENDPOINTS PRINCIPAIS
# ============================================

@app.get("/api")
def read_root():
    """Endpoint de teste - Público"""
    return {
        "status": "ok",
        "version": app.version,
        "secured": bool(API_SECRET_TOKEN),
        "database": "supabase"
    }


@app.get("/api/health")
def health_check():
    """Health check com status do banco."""
    from .services.supabase_client import supabase
    return {
        "status": "ok",
        "version": app.version,
        "database_connected": supabase is not None
    }


@app.post("/api/scan-comanda", response_model=ScanResponse)
async def scan_comanda_endpoint(file: UploadFile = File(...), token: str = Depends(verify_api_key)):
    """Recebe uma imagem de comanda, processa com a IA e retorna a lista de itens."""
    
    contents = await file.read()
    if not 0 < len(contents) <= MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Arquivo muito grande ou vazio. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB")
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Tipo não permitido. Aceitos: {', '.join(ALLOWED_EXTENSIONS)}")

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    temp_file_path = os.path.join(temp_dir, unique_filename)

    try:
        with open(temp_file_path, "wb") as buffer:
            buffer.write(contents)

        dados_extraidos = scan_receipt_to_json(temp_file_path)
        if not dados_extraidos or "itens" not in dados_extraidos:
            raise HTTPException(status_code=400, detail="A IA não conseguiu extrair itens da imagem.")

        resposta = ScanResponse(
            success=True,
            itens=[
                Item(
                    id=f"item_{uuid.uuid4().hex}",
                    nome=item.get("item", "N/A"),
                    quantidade=item.get("quantidade", 0),
                    valor_unitario=item.get("preco_unitario", 0),
                ) for item in dados_extraidos["itens"]
            ]
        )
        return resposta

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no endpoint /api/scan-comanda: {e}")
        return ScanResponse(success=False, itens=[])
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


# ============================================
# CRUD DE DIVISÕES
# ============================================

class CriarDivisaoRequest(BaseModel):
    itens: List[Item]
    nomes_pessoas: List[str]


@app.post("/api/criar-divisao", response_model=Divisao)
async def criar_divisao_endpoint(request: CriarDivisaoRequest, token: str = Depends(verify_api_key)):
    """Cria uma nova sessão de divisão com base nos itens e nos nomes das pessoas."""
    try:
        # Cria a divisão no banco
        divisao_db = db.create_divisao(user_id=DEV_USER_ID)
        if not divisao_db:
            raise HTTPException(status_code=500, detail="Erro ao criar divisão no banco")
        
        divisao_id = divisao_db["id"]
        
        # Cria as pessoas
        pessoas_data = [{"divisao_id": divisao_id, "nome": nome} for nome in request.nomes_pessoas]
        pessoas_db = db.create_pessoas_bulk(pessoas_data)
        
        # Cria os itens
        itens_data = [
            {
                "divisao_id": divisao_id,
                "nome": item.nome,
                "quantidade": item.quantidade,
                "valor_unitario": item.valor_unitario
            } for item in request.itens
        ]
        itens_db = db.create_itens_bulk(itens_data)
        
        # Busca a divisão completa para retornar
        divisao_completa = db.get_divisao_completa(divisao_id)
        if not divisao_completa:
            raise HTTPException(status_code=500, detail="Erro ao buscar divisão criada")
        
        logger.info(f"Nova divisão criada com ID: {divisao_id}")
        return db_divisao_to_response(divisao_completa)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar divisão: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar a divisão: {str(e)}")


@app.get("/api/divisao/{divisao_id}", response_model=Divisao)
async def buscar_divisao_endpoint(divisao_id: str, token: str = Depends(verify_api_key)):
    """Busca uma divisão pelo ID."""
    divisao = db.get_divisao_completa(divisao_id)
    if not divisao:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    return db_divisao_to_response(divisao)


@app.get("/api/divisoes", response_model=List[Divisao])
async def listar_divisoes_endpoint(token: str = Depends(verify_api_key)):
    """Lista todas as divisões do usuário."""
    divisoes = db.get_divisoes_by_user(DEV_USER_ID)
    result = []
    for div in divisoes:
        divisao_completa = db.get_divisao_completa(div["id"])
        if divisao_completa:
            result.append(db_divisao_to_response(divisao_completa))
    return result


# ============================================
# CONFIGURAÇÃO DA DIVISÃO
# ============================================

@app.put("/api/divisao/{divisao_id}/config", response_model=Divisao)
async def configurar_divisao_endpoint(divisao_id: str, config: ConfigDivisao, token: str = Depends(verify_api_key)):
    """Atualiza as configurações gerais da divisão."""
    divisao = db.get_divisao(divisao_id)
    if not divisao:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    
    db.update_divisao(divisao_id, {
        "taxa_servico_percentual": config.taxa_servico_percentual,
        "desconto_valor": config.desconto_valor
    })
    
    logger.info(f"Configuração da divisão '{divisao_id}' atualizada.")
    divisao_completa = db.get_divisao_completa(divisao_id)
    return db_divisao_to_response(divisao_completa)


# ============================================
# CRUD DE ITENS
# ============================================

@app.post("/api/divisao/{divisao_id}/item", response_model=Divisao)
async def adicionar_item_endpoint(divisao_id: str, item_payload: ItemPayload, token: str = Depends(verify_api_key)):
    """Adiciona um novo item à lista de itens da divisão."""
    divisao = db.get_divisao(divisao_id)
    if not divisao:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    
    novo_item = db.create_item(
        divisao_id=divisao_id,
        nome=item_payload.nome,
        quantidade=item_payload.quantidade,
        valor_unitario=item_payload.valor_unitario
    )
    
    logger.info(f"Item '{item_payload.nome}' adicionado à divisão '{divisao_id}'.")
    divisao_completa = db.get_divisao_completa(divisao_id)
    return db_divisao_to_response(divisao_completa)


@app.put("/api/divisao/{divisao_id}/item/{item_id}", response_model=Divisao)
async def editar_item_endpoint(divisao_id: str, item_id: str, item_payload: ItemPayload, token: str = Depends(verify_api_key)):
    """Edita um item existente na divisão."""
    divisao = db.get_divisao(divisao_id)
    if not divisao:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    
    db.update_item(item_id, {
        "nome": item_payload.nome,
        "quantidade": item_payload.quantidade,
        "valor_unitario": item_payload.valor_unitario
    })
    
    logger.info(f"Item '{item_payload.nome}' atualizado na divisão '{divisao_id}'.")
    divisao_completa = db.get_divisao_completa(divisao_id)
    return db_divisao_to_response(divisao_completa)


@app.delete("/api/divisao/{divisao_id}/item/{item_id}", response_model=Divisao)
async def excluir_item_endpoint(divisao_id: str, item_id: str, token: str = Depends(verify_api_key)):
    """Exclui um item da divisão."""
    divisao = db.get_divisao(divisao_id)
    if not divisao:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    
    item = db.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    
    db.delete_item(item_id)
    
    logger.info(f"Item ID '{item_id}' excluído da divisão '{divisao_id}'.")
    divisao_completa = db.get_divisao_completa(divisao_id)
    return db_divisao_to_response(divisao_completa)


# ============================================
# CRUD DE PESSOAS
# ============================================

@app.post("/api/divisao/{divisao_id}/pessoa", response_model=Divisao)
async def adicionar_pessoa_endpoint(divisao_id: str, request: AddPessoaRequest, token: str = Depends(verify_api_key)):
    """Adiciona uma nova pessoa à divisão."""
    divisao = db.get_divisao(divisao_id)
    if not divisao:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    
    # Verifica se já existe pessoa com mesmo nome
    pessoas = db.get_pessoas_by_divisao(divisao_id)
    if any(p["nome"].lower() == request.nome.lower() for p in pessoas):
        raise HTTPException(status_code=400, detail=f"Pessoa '{request.nome}' já existe na divisão.")
    
    nova_pessoa = db.create_pessoa(divisao_id, request.nome)
    
    logger.info(f"Pessoa '{request.nome}' adicionada à divisão '{divisao_id}'.")
    divisao_completa = db.get_divisao_completa(divisao_id)
    return db_divisao_to_response(divisao_completa)


@app.delete("/api/divisao/{divisao_id}/pessoa/{pessoa_id}", response_model=Divisao)
async def excluir_pessoa_endpoint(divisao_id: str, pessoa_id: str, token: str = Depends(verify_api_key)):
    """Exclui uma pessoa e redistribui suas atribuições."""
    divisao = db.get_divisao(divisao_id)
    if not divisao:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    
    pessoa = db.get_pessoa(pessoa_id)
    if not pessoa:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada.")
    
    # A redistribuição automática das atribuições acontece via CASCADE no banco
    # Mas se quisermos redistribuir para outros participantes, precisamos fazer manualmente
    # Por enquanto, apenas deletamos (as atribuições são deletadas automaticamente)
    db.delete_pessoa(pessoa_id)
    
    logger.info(f"Pessoa ID '{pessoa_id}' excluída da divisão '{divisao_id}'.")
    divisao_completa = db.get_divisao_completa(divisao_id)
    return db_divisao_to_response(divisao_completa)


# ============================================
# DISTRIBUIÇÃO DE ITENS
# ============================================

@app.post("/api/distribuir-item/{divisao_id}", response_model=Divisao)
async def distribuir_item_endpoint(divisao_id: str, request: DistribuirItemRequest, token: str = Depends(verify_api_key)):
    """Atribui um item (ou partes dele) a uma ou mais pessoas."""
    divisao = db.get_divisao(divisao_id)
    if not divisao:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    
    item = db.get_item(request.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado na divisão.")
    
    quantidade_total_distribuida = sum(d.quantidade for d in request.distribuicao)
    if quantidade_total_distribuida > float(item["quantidade"]) + 1e-9:
        raise HTTPException(
            status_code=400,
            detail=f"Quantidade distribuída ({quantidade_total_distribuida}) maior que disponível ({item['quantidade']})."
        )
    
    # Limpa atribuições antigas do item
    db.delete_atribuicoes_by_item(request.item_id)
    
    # Cria novas atribuições
    for dist in request.distribuicao:
        if dist.quantidade > 0:
            db.create_atribuicao(request.item_id, dist.pessoa_id, dist.quantidade)
    
    logger.info(f"Item '{item['nome']}' distribuído na divisão '{divisao_id}'.")
    divisao_completa = db.get_divisao_completa(divisao_id)
    return db_divisao_to_response(divisao_completa)


# ============================================
# CÁLCULO DE TOTAIS
# ============================================

@app.get("/api/calcular-totais/{divisao_id}", response_model=TotaisResponse)
async def calcular_totais_endpoint(divisao_id: str, token: str = Depends(verify_api_key)):
    """Calcula e retorna os totais para cada pessoa."""
    divisao_completa = db.get_divisao_completa(divisao_id)
    if not divisao_completa:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")
    
    divisao = db_divisao_to_response(divisao_completa)
    
    # Calcula totais por pessoa
    calculos_pessoas = {
        p.id: PessoaTotal(nome=p.nome, itens=[], subtotal=0, taxa=0, desconto=0, total=0, percentual_da_conta=0)
        for p in divisao.pessoas
    }
    
    subtotal_geral_consumo = 0
    for item in divisao.itens:
        for pessoa_id, quantidade in item.atribuido_a.items():
            if pessoa_id in calculos_pessoas:
                valor_consumido = quantidade * item.valor_unitario
                calculos_pessoas[pessoa_id].subtotal += valor_consumido
                calculos_pessoas[pessoa_id].itens.append(
                    ItemConsumido(nome=item.nome, quantidade=quantidade, valor=valor_consumido, desconto_aplicado=0)
                )
        subtotal_geral_consumo += item.quantidade * item.valor_unitario
    
    if subtotal_geral_consumo == 0:
        return TotaisResponse(
            pessoas=list(calculos_pessoas.values()),
            progresso=Progresso(percentual_distribuido=0, itens_restantes=len(divisao.itens))
        )
    
    valor_apos_desconto = subtotal_geral_consumo - divisao.desconto_valor
    valor_taxa_servico = valor_apos_desconto * (divisao.taxa_servico_percentual / 100)
    total_geral_final = valor_apos_desconto + valor_taxa_servico
    
    for pessoa_id, calculo in calculos_pessoas.items():
        proporcao_consumo = calculo.subtotal / subtotal_geral_consumo if subtotal_geral_consumo > 0 else 0
        calculo.desconto = divisao.desconto_valor * proporcao_consumo
        calculo.taxa = valor_taxa_servico * proporcao_consumo
        calculo.total = (calculo.subtotal - calculo.desconto) + calculo.taxa
        calculo.percentual_da_conta = (calculo.total / total_geral_final) * 100 if total_geral_final > 0 else 0
        
        for item_consumido in calculo.itens:
            proporcao_item = item_consumido.valor / calculo.subtotal if calculo.subtotal > 0 else 0
            item_consumido.desconto_aplicado = calculo.desconto * proporcao_item
    
    # Calcula progresso
    quantidade_total_geral = sum(item.quantidade for item in divisao.itens)
    quantidade_total_distribuida = sum(sum(item.atribuido_a.values()) for item in divisao.itens)
    percentual_distribuido = (quantidade_total_distribuida / quantidade_total_geral) * 100 if quantidade_total_geral > 0 else 0
    
    itens_incompletos = sum(
        1 for item in divisao.itens if item.quantidade - sum(item.atribuido_a.values()) > 1e-9
    )
    
    progresso = Progresso(
        percentual_distribuido=round(percentual_distribuido, 2),
        itens_restantes=itens_incompletos
    )
    
    return TotaisResponse(pessoas=list(calculos_pessoas.values()), progresso=progresso)


# --- Execução do Servidor ---
if __name__ == "__main__":
    print("🔒 Compartilha AI API - Com Supabase")
    print("uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001")