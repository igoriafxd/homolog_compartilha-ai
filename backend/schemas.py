# --- Anotações para Iniciantes ---
# Este arquivo é como o "cardápio de regras" da nossa API.
# Usamos uma biblioteca chamada Pydantic para definir a "forma" exata dos dados.
# Cada `class` que herda de `BaseModel` é um "schema", ou seja, um contrato.
# Isso garante que o frontend sempre envie os dados no formato que esperamos,
# evitando bugs e tornando a API mais segura e previsível.
# Pense nisso como preencher um formulário: se um campo obrigatório estiver faltando
# ou tiver o tipo errado (ex: texto em vez de número), o Pydantic automaticamente
# recusa a requisição com um erro claro.

from pydantic import BaseModel, Field
from typing import List, Dict
import uuid

# --- Modelos Principais ---

class Item(BaseModel):
    """
    Representa um único item da conta, como "1x Coca-Cola".
    Este é o modelo completo, com ID e informações de quem consumiu.
    """
    id: str
    nome: str
    quantidade: float
    valor_unitario: float
    atribuido_a: Dict[str, float] = {} # Ex: { "id_da_pessoa_1": 2 }

class Pessoa(BaseModel):
    """
    Representa uma pessoa que está participando da divisão.
    Cada pessoa tem um ID único para podermos atribuir itens a ela.
    """
    id: str = Field(default_factory=lambda: f"pessoa_{uuid.uuid4().hex}")
    nome: str

class Divisao(BaseModel):
    """
    O objeto principal que representa o estado completo de uma divisão de conta.
    Ele contém a lista de todos os itens, todas as pessoas e as configurações da conta.
    """
    id: str = Field(default_factory=lambda: f"divisao_{uuid.uuid4().hex}")
    itens: List[Item]
    pessoas: List[Pessoa]
    status: str = "em_andamento"

    ### --- NOVOS CAMPOS PARA FLEXIBILIDADE --- ###
    # Adicionamos estes campos para permitir que o usuário personalize a conta.
    # Eles têm valores padrão, então não quebram a lógica antiga.

    # A taxa de serviço agora pode ser definida pelo usuário. O padrão é 10%.
    taxa_servico_percentual: float = 10.0

    # O valor do desconto a ser aplicado no final da conta. O padrão é R$ 0.00.
    desconto_valor: float = 0.0


# --- Modelos para Requisições e Respostas da API ---
# Estes são os "formulários" específicos que cada endpoint usa.

class ScanResponse(BaseModel):
    """ A resposta que a API envia após escanear uma imagem. """
    success: bool
    itens: List[Item]

class DistribuicaoItem(BaseModel):
    """ Define como um único item é distribuído para UMA pessoa. """
    pessoa_id: str
    quantidade: float

class DistribuirItemRequest(BaseModel):
    """ O "formulário" que o frontend envia para distribuir UM item para VÁRIAS pessoas. """
    item_id: str
    distribuicao: List[DistribuicaoItem]

### --- NOVOS SCHEMAS PARA EDIÇÃO DA CONTA --- ###

class ItemPayload(BaseModel):
    """
    O "formulário" para ADICIONAR ou EDITAR um item.
    Não precisamos do ID aqui, pois ou ele ainda não existe (adição) ou ele virá
    pela URL da API (edição). Também não precisamos do `atribuido_a`.
    """
    nome: str
    quantidade: float
    valor_unitario: float

class ConfigDivisao(BaseModel):
    """
    O "formulário" para o frontend nos enviar as novas configurações de
    taxa de serviço e desconto.
    """
    taxa_servico_percentual: float
    desconto_valor: float

class AddPessoaRequest(BaseModel):
    """ O "formulário" para adicionar uma nova pessoa a uma divisão existente. """
    nome: str


# --- Modelos para a Resposta do Cálculo de Totais ---
# Estes schemas definem a estrutura da resposta final que o usuário vê.

class ItemConsumido(BaseModel):
    """ Representa um item (ou parte dele) consumido por uma pessoa no resumo final. """
    nome: str
    quantidade: float
    valor: float # O valor total para a quantidade que a pessoa consumiu
    desconto_aplicado: float # Quanto de desconto foi aplicado a este item para esta pessoa

class PessoaTotal(BaseModel):
    """ O resumo financeiro completo para uma pessoa. """
    nome: str
    itens: List[ItemConsumido]
    subtotal: float
    taxa: float
    desconto: float # Quanto de desconto total a pessoa recebeu
    total: float
    percentual_da_conta: float

class Progresso(BaseModel):
    """ Representa o progresso geral da distribuição dos itens. """
    percentual_distribuido: float
    itens_restantes: int

class TotaisResponse(BaseModel):
    """ O modelo de resposta completo para o endpoint de cálculo de totais. """
    pessoas: List[PessoaTotal]
    progresso: Progresso