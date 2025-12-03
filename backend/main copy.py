# --- Anotações para Iniciantes ---
# Este arquivo é o "coração" do nosso backend. É aqui que a mágica acontece.
# Ele usa um framework chamado FastAPI para criar os "endpoints" da nossa API.
# Um endpoint é como um "link" que o frontend pode acessar para pedir ou enviar informações.
# Cada função que começa com `@app.get`, `@app.post`, etc., define um desses links.
# A ordem das funções importa para a leitura, então agrupamos por funcionalidade.

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
import shutil
import os
import uuid # Usado para gerar IDs únicos para novos itens

# --- Importações do nosso próprio projeto ---

# Importa o nosso "cérebro" de IA do arquivo `ia_scanner.py`
from .services.ia_scanner import scan_receipt_to_json

# Importa todos os "contratos" (schemas) do arquivo `schemas.py`
from .schemas import (
    Item, ScanResponse, Pessoa, Divisao, DistribuirItemRequest, TotaisResponse,
    PessoaTotal, ItemConsumido, Progresso, ItemPayload, ConfigDivisao, AddPessoaRequest
)

# --- "Banco de Dados" em Memória ---
# Para este protótipo, vamos armazenar as sessões de divisão ativas em um dicionário.
# A chave será o ID da divisão (ex: "divisao_xyz") e o valor será o objeto Divisao completo.
# Se o servidor for reiniciado, esses dados são perdidos.
sessoes_ativas: Dict[str, Divisao] = {}

# --- Configuração da Aplicação FastAPI ---
app = FastAPI(
    title="Compartilha AI API",
    description="API para escanear e dividir contas de restaurante.",
    version="1.1.0" # Versão atualizada para refletir as novas features
)

# Adiciona o middleware de CORS. Isso é uma configuração de segurança que permite
# que o nosso frontend (rodando em um endereço como http://192.168.1.103:5173)
# possa fazer requisições para a nossa API (rodando em http://192.168.1.103:8001).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://192.168.1.104:5173",
        "https://compartilha-ai.vercel.app", # Placeholder para o futuro deploy
        'https://www.iafxd.com',
        'https://iafxd.com',
        'https://www.iafxd.com/',
        'https://iafxd.com/',
    ],
    allow_credentials=True,
    allow_methods=["*"], # Permite todos os métodos (GET, POST, PUT, DELETE)
    allow_headers=["*"],
)

# --- Endpoints Principais ---

@app.get("/api")
def read_root():
    """ Endpoint de teste para verificar se a API está online. """
    return {"status": "ok", "version": app.version}

@app.post("/api/scan-comanda", response_model=ScanResponse)
async def scan_comanda_endpoint(file: UploadFile = File(...)):
    """
    Recebe uma imagem de comanda, processa com a IA e retorna a lista de itens.
    """
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        dados_extraidos = scan_receipt_to_json(temp_file_path)
        if not dados_extraidos or "itens" not in dados_extraidos:
            raise HTTPException(status_code=400, detail="A IA não conseguiu extrair itens da imagem.")

        resposta = ScanResponse(
            success=True,
            itens=[
                Item(
                    # Geramos um ID único para cada item para podermos gerenciá-lo depois
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
    """ Modelo para a requisição de criação de uma nova divisão. """
    itens: List[Item]
    nomes_pessoas: List[str]

@app.post("/api/criar-divisao", response_model=Divisao)
async def criar_divisao_endpoint(request: CriarDivisaoRequest):
    """
    Cria uma nova sessão de divisão com base nos itens e nos nomes das pessoas.
    """
    try:
        pessoas = [Pessoa(nome=nome) for nome in request.nomes_pessoas]
        nova_divisao = Divisao(itens=request.itens, pessoas=pessoas)
        sessoes_ativas[nova_divisao.id] = nova_divisao
        print(f"Nova divisão criada com ID: {nova_divisao.id}")
        return nova_divisao
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar a divisão: {str(e)}")

# --- Endpoints de Gerenciamento da Divisão (NOVOS!) ---

@app.put("/api/divisao/{divisao_id}/config", response_model=Divisao)
async def configurar_divisao_endpoint(divisao_id: str, config: ConfigDivisao):
    """
    Atualiza as configurações gerais da divisão, como taxa de serviço e desconto.
    """
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    divisao.taxa_servico_percentual = config.taxa_servico_percentual
    divisao.desconto_valor = config.desconto_valor

    print(f"Configuração da divisão '{divisao_id}' atualizada.")
    return divisao

@app.post("/api/divisao/{divisao_id}/item", response_model=Divisao)
async def adicionar_item_endpoint(divisao_id: str, item_payload: ItemPayload):
    """
    Adiciona um novo item (ex: couvert) à lista de itens da divisão.
    """
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
async def editar_item_endpoint(divisao_id: str, item_id: str, item_payload: ItemPayload):
    """
    Edita um item existente na divisão.
    """
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
async def excluir_item_endpoint(divisao_id: str, item_id: str):
    """
    Exclui um item da divisão.
    """
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    item_index = next((i for i, item in enumerate(divisao.itens) if item.id == item_id), -1)

    if item_index == -1:
        raise HTTPException(status_code=404, detail="Item não encontrado.")

    # Remove o item da lista pelo seu índice
    del divisao.itens[item_index]

    print(f"Item ID '{item_id}' excluído da divisão '{divisao_id}'.")
    return divisao

@app.post("/api/divisao/{divisao_id}/pessoa", response_model=Divisao)
async def adicionar_pessoa_endpoint(divisao_id: str, request: AddPessoaRequest):
    """
    Adiciona uma nova pessoa à divisão.
    """
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    
    # Verifica se já existe uma pessoa com o mesmo nome (ignorando maiúsculas/minúsculas)
    if any(p.nome.lower() == request.nome.lower() for p in divisao.pessoas):
        raise HTTPException(status_code=400, detail=f"Uma pessoa com o nome '{request.nome}' já existe na divisão.")

    nova_pessoa = Pessoa(nome=request.nome)
    divisao.pessoas.append(nova_pessoa)

    print(f"Pessoa '{nova_pessoa.nome}' adicionada à divisão '{divisao_id}'.")
    return divisao

@app.delete("/api/divisao/{divisao_id}/pessoa/{pessoa_id}", response_model=Divisao)
async def excluir_pessoa_endpoint(divisao_id: str, pessoa_id: str):
    """
    Exclui uma pessoa de uma divisão e redistribui de forma inteligente 
    suas atribuições de itens.
    """
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    pessoa_index = next((i for i, p in enumerate(divisao.pessoas) if p.id == pessoa_id), -1)

    if pessoa_index == -1:
        raise HTTPException(status_code=404, detail="Pessoa não encontrada.")

    # Itera sobre os itens ANTES de remover a pessoa, para ajustar as atribuições.
    for item in divisao.itens:
        if pessoa_id in item.atribuido_a:
            quantidade_removida = item.atribuido_a.pop(pessoa_id)
            
            # Verifica se o item ainda está atribuído a outras pessoas.
            participantes_restantes = item.atribuido_a.keys()
            
            if participantes_restantes:
                # Cenário 1: Item compartilhado. Redistribui a quantidade.
                quota_para_redistribuir = quantidade_removida / len(participantes_restantes)
                for pid in participantes_restantes:
                    item.atribuido_a[pid] += quota_para_redistribuir
            # Cenário 2: Item individual. A quantidade simplesmente volta a ser "pendente"
            # ao remover a atribuição, então nenhuma ação extra é necessária.

    # Agora, remove a pessoa da lista principal da divisão.
    del divisao.pessoas[pessoa_index]
    
    print(f"Pessoa ID '{pessoa_id}' excluída e itens redistribuídos na divisão '{divisao_id}'.")
    return divisao


# --- Endpoint de Distribuição e Cálculo ---

@app.post("/api/distribuir-item/{divisao_id}", response_model=Divisao)
async def distribuir_item_endpoint(divisao_id: str, request: DistribuirItemRequest):
    """
    Atribui um item (ou partes dele) a uma ou mais pessoas em uma divisão.
    """
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]
    item_para_distribuir = next((item for item in divisao.itens if item.id == request.item_id), None)
    if not item_para_distribuir:
        raise HTTPException(status_code=404, detail="Item não encontrado na divisão.")

    # Usamos uma tolerância (epsilon) para comparar floats, evitando problemas de precisão.
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
async def calcular_totais_endpoint(divisao_id: str):
    """
    Calcula e retorna os totais para cada pessoa, com a nova lógica de
    desconto e taxas flexíveis.
    """
    if divisao_id not in sessoes_ativas:
        raise HTTPException(status_code=404, detail="Divisão não encontrada.")

    divisao = sessoes_ativas[divisao_id]

    # Dicionário para guardar os cálculos de cada pessoa.
    # Usamos o ID da pessoa como chave para facilitar o acesso.
    calculos_pessoas: Dict[str, PessoaTotal] = {
        p.id: PessoaTotal(nome=p.nome, itens=[], subtotal=0, taxa=0, desconto=0, total=0, percentual_da_conta=0)
        for p in divisao.pessoas
    }

    # 1. Calcular o subtotal de consumo de cada pessoa e o subtotal geral da conta.
    subtotal_geral_consumo = 0
    for item in divisao.itens:
        for pessoa_id, quantidade in item.atribuido_a.items():
            if pessoa_id in calculos_pessoas:
                valor_consumido = quantidade * item.valor_unitario
                calculos_pessoas[pessoa_id].subtotal += valor_consumido
                # Adicionamos o item à lista de consumo da pessoa (sem desconto ainda)
                calculos_pessoas[pessoa_id].itens.append(
                    ItemConsumido(nome=item.nome, quantidade=quantidade, valor=valor_consumido, desconto_aplicado=0)
                )
        subtotal_geral_consumo += item.quantidade * item.valor_unitario

    # Se ninguém consumiu nada, não há o que calcular.
    if subtotal_geral_consumo == 0:
        return TotaisResponse(pessoas=list(calculos_pessoas.values()), progresso=Progresso(percentual_distribuido=0, itens_restantes=len(divisao.itens)))

    # 2. Calcular o valor total da conta, aplicando desconto e taxa de serviço.
    # A ordem é importante: primeiro o desconto, depois a taxa sobre o valor com desconto.
    valor_apos_desconto = subtotal_geral_consumo - divisao.desconto_valor
    valor_taxa_servico = valor_apos_desconto * (divisao.taxa_servico_percentual / 100)
    total_geral_final = valor_apos_desconto + valor_taxa_servico

    # 3. Distribuir os custos (taxa) e benefícios (desconto) proporcionalmente.
    for pessoa_id, calculo in calculos_pessoas.items():
        # A proporção de consumo da pessoa é o seu subtotal dividido pelo subtotal geral.
        proporcao_consumo = calculo.subtotal / subtotal_geral_consumo if subtotal_geral_consumo > 0 else 0

        # A pessoa recebe uma fatia do desconto e paga uma fatia da taxa com base nessa proporção.
        calculo.desconto = divisao.desconto_valor * proporcao_consumo
        calculo.taxa = valor_taxa_servico * proporcao_consumo
        calculo.total = (calculo.subtotal - calculo.desconto) + calculo.taxa
        calculo.percentual_da_conta = (calculo.total / total_geral_final) * 100 if total_geral_final > 0 else 0

        # Agora, distribuímos o desconto da pessoa entre os itens que ela consumiu.
        for item_consumido in calculo.itens:
            proporcao_item_no_subtotal_pessoa = item_consumido.valor / calculo.subtotal if calculo.subtotal > 0 else 0
            item_consumido.desconto_aplicado = calculo.desconto * proporcao_item_no_subtotal_pessoa


    # 4. Calcular o progresso da distribuição (baseado em quantidade).
    quantidade_total_geral = sum(item.quantidade for item in divisao.itens)
    quantidade_total_distribuida = sum(sum(item.atribuido_a.values()) for item in divisao.itens)

    percentual_distribuido = (quantidade_total_distribuida / quantidade_total_geral) * 100 if quantidade_total_geral > 0 else 0

    # Itens restantes são aqueles cuja quantidade distribuída é menor que a quantidade total.
    # Usamos uma pequena tolerância (epsilon) para comparações de ponto flutuante.
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
    # Esta parte só é executada se você rodar o arquivo diretamente com `python main.py`.
    # O Uvicorn usa a string "backend.main:app" para encontrar a variável `app` neste arquivo.
    print("Para iniciar o servidor, navegue até a pasta raiz 'compartilha-ai' e rode no terminal:")
    print("uvicorn backend.main:app --reload --host SEU_IP --port 8001")