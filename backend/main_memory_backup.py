# --- Anotações para Iniciantes ---
# Este arquivo é o "coração" do nosso backend.
# ATUALIZADO: Agora com autenticação por token para proteger a API!

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
import shutil
import os
import uuid
from dotenv import load_dotenv

# Carrega .env da mesma pasta do main.py (backend/)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Verifica se o token foi configurado
API_SECRET_TOKEN = os.getenv("API_SECRET_TOKEN")
if API_SECRET_TOKEN:
    print(f"✅ Token carregado: {API_SECRET_TOKEN[:8]}...")
else:
    print("⚠️ Rodando SEM autenticação (modo desenvolvimento)")

# --- Importações do nosso próprio projeto ---
from .services.ia_scanner import scan_receipt_to_json
from .schemas import (
    Item, ScanResponse, Pessoa, Divisao, DistribuirItemRequest, TotaisResponse,
    PessoaTotal, ItemConsumido, Progresso, ItemPayload, ConfigDivisao, AddPessoaRequest
)

# --- "Banco de Dados" em Memória ---
sessoes_ativas: Dict[str, Divisao] = {}

# --- Configuração da Aplicação FastAPI ---
app = FastAPI(
    title="Compartilha AI API",
    description="API para escanear e dividir contas de restaurante.",
    version="2.0.0"  # Versão atualizada com segurança
)

# Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Desenvolvimento Local
        "http://192.168.1.104:5173", # Desenvolvimento Local em Rede
        "https://compartilha-ai.vercel.app",  # Deploy principal no Vercel
        "https://www.iafxd.com",  # Domínio personalizado
        "https://iafxd.com",  # Domínio personalizado (sem www)
        "https://www.iafxd.com/", # Domínio personalizado com barra final
        "https://iafxd.com/", # Domínio personalizado sem www e com barra final
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de Segurança (Helmet) customizado
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

class CustomSecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response

app.add_middleware(CustomSecurityHeadersMiddleware)

# --- Esquema e Função de Autenticação ---
api_key_scheme = APIKeyHeader(name="x-api-key", auto_error=False)

async def verify_api_key(x_api_key: Optional[str] = Depends(api_key_scheme)):
    """
    Verifica se o token de API enviado no header é válido.
    Se não houver token configurado (.env), permite acesso (modo dev).
    """
    # Se não configurou token, permite (desenvolvimento)
    if not API_SECRET_TOKEN:
        return None
    
    # Se configurou token, verifica
    if not x_api_key or x_api_key != API_SECRET_TOKEN:
        raise HTTPException(
            status_code=403,
            detail="🔒 Token de API inválido ou ausente"
        )
    return x_api_key

# --- Endpoints Principais ---

@app.get("/api")
def read_root():
    """Endpoint de teste - Público"""
    return {
        "status": "ok", 
        "version": app.version,
        "secured": bool(API_SECRET_TOKEN)
    }

# --- Constantes de Configuração ---
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

@app.post("/api/scan-comanda", response_model=ScanResponse)
async def scan_comanda_endpoint(file: UploadFile = File(...), token: str = Depends(verify_api_key)):
    """Recebe uma imagem de comanda, processa com a IA e retorna a lista de itens.
    """
    
    # Validação de tamanho do arquivo
    contents = await file.read()
    if not 0 < len(contents) <= MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"Arquivo muito grande ou vazio. Tamanho máximo: {MAX_FILE_SIZE / (1024 * 1024):.0f}MB.")
    
    # Validação de tipo de arquivo
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Tipo de arquivo não permitido. Apenas {', '.join(ALLOWED_EXTENSIONS)} são aceitos.")

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    # Cria um nome de arquivo único para evitar colisões
    file_extension = file.filename.split('.')[-1].lower()
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

    except Exception as e:
        error_response = ScanResponse(success=False, itens=[])
        print(f"Erro no endpoint /api/scan-comanda: {e}")
        return error_response
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

class CriarDivisaoRequest(BaseModel):
    """Modelo para a requisição de criação de uma nova divisão."""
    itens: List[Item]
    nomes_pessoas: List[str]

@app.post("/api/criar-divisao", response_model=Divisao)
async def criar_divisao_endpoint(request: CriarDivisaoRequest, token: str = Depends(verify_api_key)):
    """Cria uma nova sessão de divisão com base nos itens e nos nomes das pessoas."""
    try:
        pessoas = [Pessoa(nome=nome) for nome in request.nomes_pessoas]
        nova_divisao = Divisao(itens=request.itens, pessoas=pessoas)
        sessoes_ativas[nova_divisao.id] = nova_divisao
        print(f"Nova divisão criada com ID: {nova_divisao.id}")
        return nova_divisao
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar a divisão: {str(e)}")

# --- Endpoints de Gerenciamento da Divisão ---

@app.put("/api/divisao/{divisao_id}/config", response_model=Divisao)
async def configurar_divisao_endpoint(divisao_id: str, config: ConfigDivisao, token: str = Depends(verify_api_key)):
    """Atualiza as configurações gerais da divisão, como taxa de serviço e desconto."""
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    divisao.taxa_servico_percentual = config.taxa_servico_percentual
    divisao.desconto_valor = config.desconto_valor

    print(f"Configuração da divisão '{divisao_id}' atualizada.")
    return divisao

@app.post("/api/divisao/{divisao_id}/item", response_model=Divisao)
async def adicionar_item_endpoint(divisao_id: str, item_payload: ItemPayload, token: str = Depends(verify_api_key)):
    """Adiciona um novo item (ex: couvert) à lista de itens da divisão."""
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    novo_item = Item(
        id=f"item_{uuid.uuid4().hex}",
        nome=item_payload.nome,
        quantidade=item_payload.quantidade,
        valor_unitario=item_payload.valor_unitario
    )
    divisao.itens.append(novo_item)

    print(f"Item '{novo_item.nome}' adicionado à divisão '{divisao_id}'.")
    return divisao

@app.put("/api/divisao/{divisao_id}/item/{item_id}", response_model=Divisao)
async def editar_item_endpoint(divisao_id: str, item_id: str, item_payload: ItemPayload, token: str = Depends(verify_api_key)):
    """Edita um item existente na divisão."""
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    item_para_editar = next((item for item in divisao.itens if item.id == item_id), None)

    if not item_para_editar:
        raise HTTPException(status_code=404, detail="Item não encontrado.")

    item_para_editar.nome = item_payload.nome
    item_para_editar.quantidade = item_payload.quantidade
    item_para_editar.valor_unitario = item_payload.valor_unitario

    print(f"Item '{item_para_editar.nome}' atualizado na divisão '{divisao_id}'.")
    return divisao

@app.delete("/api/divisao/{divisao_id}/item/{item_id}", response_model=Divisao)
async def excluir_item_endpoint(divisao_id: str, item_id: str, token: str = Depends(verify_api_key)):
    """Exclui um item da divisão."""
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    item_index = next((i for i, item in enumerate(divisao.itens) if item.id == item_id), -1)

    if item_index == -1:
        raise HTTPException(status_code=404, detail="Item não encontrado.")

    del divisao.itens[item_index]

    print(f"Item ID '{item_id}' excluído da divisão '{divisao_id}'.")
    return divisao

@app.post("/api/divisao/{divisao_id}/pessoa", response_model=Divisao)
async def adicionar_pessoa_endpoint(divisao_id: str, request: AddPessoaRequest, token: str = Depends(verify_api_key)):
    """Adiciona uma nova pessoa à divisão."""
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    
    if any(p.nome.lower() == request.nome.lower() for p in divisao.pessoas):
        raise HTTPException(status_code=400, detail=f"Uma pessoa com o nome '{request.nome}' já existe na divisão.")

    nova_pessoa = Pessoa(nome=request.nome)
    divisao.pessoas.append(nova_pessoa)

    print(f"Pessoa '{nova_pessoa.nome}' adicionada à divisão '{divisao_id}'.")
    return divisao

@app.delete("/api/divisao/{divisao_id}/pessoa/{pessoa_id}", response_model=Divisao)
async def excluir_pessoa_endpoint(divisao_id: str, pessoa_id: str, token: str = Depends(verify_api_key)):
    """Exclui uma pessoa de uma divisão e redistribui de forma inteligente suas atribuições de itens."""
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    pessoa_index = next((i for i, p in enumerate(divisao.pessoas) if p.id == pessoa_id), -1)

    if pessoa_index == -1:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada.")

    for item in divisao.itens:
        if pessoa_id in item.atribuido_a:
            quantidade_removida = item.atribuido_a.pop(pessoa_id)
            participantes_restantes = item.atribuido_a.keys()
            
            if participantes_restantes:
                quota_para_redistribuir = quantidade_removida / len(participantes_restantes)
                for pid in participantes_restantes:
                    item.atribuido_a[pid] += quota_para_redistribuir

    del divisao.pessoas[pessoa_index]
    
    print(f"Pessoa ID '{pessoa_id}' excluída e itens redistribuídos na divisão '{divisao_id}'.")
    return divisao

# --- Endpoint de Distribuição e Cálculo ---

@app.post("/api/distribuir-item/{divisao_id}", response_model=Divisao)
async def distribuir_item_endpoint(divisao_id: str, request: DistribuirItemRequest, token: str = Depends(verify_api_key)):
    """Atribui um item (ou partes dele) a uma ou mais pessoas em uma divisão."""
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    item_para_distribuir = next((item for item in divisao.itens if item.id == request.item_id), None)
    if not item_para_distribuir:
        raise HTTPException(status_code=404, detail="Item não encontrado na divisão.")

    quantidade_total_distribuida = sum(d.quantidade for d in request.distribuicao)
    if quantidade_total_distribuida > item_para_distribuir.quantidade + 1e-9:
        raise HTTPException(
            status_code=400,
            detail=f"A quantidade distribuída ({quantidade_total_distribuida}) é maior que a quantidade disponível ({item_para_distribuir.quantidade})."
        )

    item_para_distribuir.atribuido_a.clear()
    for dist in request.distribuicao:
        item_para_distribuir.atribuido_a[dist.pessoa_id] = dist.quantidade

    print(f"Item '{item_para_distribuir.nome}' distribuído na divisão '{divisao_id}'.")
    return divisao

@app.get("/api/calcular-totais/{divisao_id}", response_model=TotaisResponse)
async def calcular_totais_endpoint(divisao_id: str, token: str = Depends(verify_api_key)):
    """Calcula e retorna os totais para cada pessoa, com a nova lógica de desconto e taxas flexíveis."""
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]

    calculos_pessoas: Dict[str, PessoaTotal] = {
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
        return TotaisResponse(pessoas=list(calculos_pessoas.values()), progresso=Progresso(percentual_distribuido=0, itens_restantes=len(divisao.itens)))

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
            proporcao_item_no_subtotal_pessoa = item_consumido.valor / calculo.subtotal if calculo.subtotal > 0 else 0
            item_consumido.desconto_aplicado = calculo.desconto * proporcao_item_no_subtotal_pessoa

    quantidade_total_geral = sum(item.quantidade for item in divisao.itens)
    quantidade_total_distribuida = sum(sum(item.atribuido_a.values()) for item in divisao.itens)

    percentual_distribuido = (quantidade_total_distribuida / quantidade_total_geral) * 100 if quantidade_total_geral > 0 else 0

    itens_com_distribuicao_incompleta = sum(
        1 for item in divisao.itens if item.quantidade - sum(item.atribuido_a.values()) > 1e-9
    )
    
    progresso = Progresso(
        percentual_distribuido=round(percentual_distribuido, 2),
        itens_restantes=itens_com_distribuicao_incompleta
    )

    return TotaisResponse(
        pessoas=list(calculos_pessoas.values()),
        progresso=progresso
    )

# --- Execução do Servidor ---
if __name__ == "__main__":
    print("🔒 Compartilha AI API - Protegida com Token")
    print("Para iniciar o servidor, navegue até a pasta raiz 'compartilha-ai' e rode no terminal:")
    print("uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001")