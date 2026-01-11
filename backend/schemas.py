# --- Anotações para Iniciantes ---
# Este arquivo é como o "cardápio de regras" da nossa API.
# Usamos uma biblioteca chamada Pydantic para definir a "forma" exata dos dados.
# Cada `class` que herda de `BaseModel` é um "schema", ou seja, um contrato.
# Isso garante que o frontend sempre envie os dados no formato que esperamos,
# evitando bugs e tornando a API mais segura e previsível.

from pydantic import BaseModel, Field
from typing import List, Dict
import uuid


# --- Modelos Principais ---

class Item(BaseModel):
    """Representa um único item da conta, como '1x Coca-Cola'."""
    id: str = Field(example="item_abc123")
    nome: str = Field(min_length=1, example="Coca-Cola")
    quantidade: float = Field(ge=0, example=2)
    valor_unitario: float = Field(ge=0, example=8.50)
    atribuido_a: Dict[str, float] = Field(default={}, example={"pessoa_123": 1.5})


class Pessoa(BaseModel):
    """Representa uma pessoa que está participando da divisão."""
    id: str = Field(default_factory=lambda: f"pessoa_{uuid.uuid4().hex}")
    nome: str = Field(min_length=1, example="João")


class Divisao(BaseModel):
    """
    O objeto principal que representa o estado completo de uma divisão de conta.
    Contém a lista de todos os itens, todas as pessoas e as configurações da conta.
    """
    id: str = Field(default_factory=lambda: f"divisao_{uuid.uuid4().hex}")
    nome: str = Field(default="Divisão sem nome")  # Nome da divisão
    itens: List[Item]
    pessoas: List[Pessoa]
    status: str = "em_andamento"
    taxa_servico_percentual: float = Field(default=10.0, ge=0, le=100)
    desconto_valor: float = Field(default=0.0, ge=0)


# --- Modelos para Requisições e Respostas da API ---

class ScanResponse(BaseModel):
    """A resposta que a API envia após escanear uma imagem."""
    success: bool
    itens: List[Item]


class DistribuicaoItem(BaseModel):
    """Define como um único item é distribuído para UMA pessoa."""
    pessoa_id: str
    quantidade: float = Field(ge=0)


class DistribuirItemRequest(BaseModel):
    """O 'formulário' que o frontend envia para distribuir UM item para VÁRIAS pessoas."""
    item_id: str
    distribuicao: List[DistribuicaoItem]


class ItemPayload(BaseModel):
    """O 'formulário' para ADICIONAR ou EDITAR um item."""
    nome: str = Field(min_length=1, example="Couvert")
    quantidade: float = Field(ge=0, example=4)
    valor_unitario: float = Field(ge=0, example=15.00)


class ConfigDivisao(BaseModel):
    """Configurações de taxa de serviço e desconto."""
    taxa_servico_percentual: float = Field(ge=0, le=100, example=10.0)
    desconto_valor: float = Field(ge=0, example=20.00)


class AddPessoaRequest(BaseModel):
    """O 'formulário' para adicionar uma nova pessoa a uma divisão existente."""
    nome: str = Field(min_length=1, example="Maria")


# --- Modelos para a Resposta do Cálculo de Totais ---

class ItemConsumido(BaseModel):
    """Representa um item consumido por uma pessoa no resumo final."""
    nome: str
    quantidade: float
    valor: float
    desconto_aplicado: float


class PessoaTotal(BaseModel):
    """O resumo financeiro completo para uma pessoa."""
    nome: str
    itens: List[ItemConsumido]
    subtotal: float
    taxa: float
    desconto: float
    total: float
    percentual_da_conta: float


class Progresso(BaseModel):
    """Representa o progresso geral da distribuição dos itens."""
    percentual_distribuido: float
    itens_restantes: int


class TotaisResponse(BaseModel):
    """O modelo de resposta completo para o endpoint de cálculo de totais."""
    pessoas: List[PessoaTotal]
    progresso: Progresso