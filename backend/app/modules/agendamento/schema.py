# Vinicius - 11/04/2026
# Arquivo de schema para o agendamento

# Vinicius - 21/04/2026
# Refatorado para suportar múltiplos serviços por agendamento (M2M)

from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from datetime import datetime
from typing import List, Optional


# --- Schema de Serviço Simples (usado dentro da resposta do agendamento) ---
class ServicoSimples(BaseModel):
    id: int
    nome: str
    preco: float
    duracao_minutos: int

    model_config = ConfigDict(from_attributes=True)


# --- Campos Compartilhados ---
class AgendamentoBase(BaseModel):
    """
    Documentação dos campos fundamentais.
    Contém os dados que são comuns tanto na entrada quanto na saída.
    """

    data_agendamento: datetime = Field(
        ..., description="Data e hora do serviço (ISO 8601)"
    )
    barbeiro_id: int = Field(..., gt=0, description="ID único do barbeiro")
    cliente_id: int = Field(..., gt=0)


# --- Contratos de Entrada (Inputs) ---
class AgendamentoCreate(AgendamentoBase):
    """
    Especificação Técnica para CRIAÇÃO:
    Recebe os campos base + lista de serviços.
    """

    servico_ids: List[int] = Field(
        ..., min_length=1, description="Lista com pelo menos um ID de serviço"
    )
    observacoes: Optional[str] = Field(None, max_length=500, description="Notas extras")

    @field_validator("servico_ids")
    @classmethod
    def validar_servico_ids(cls, v):
        if not v:
            raise ValueError("É obrigatório informar ao menos um serviço.")
        if any(sid <= 0 for sid in v):
            raise ValueError("Todos os IDs de serviço devem ser maiores que zero.")
        if len(v) != len(set(v)):
            raise ValueError("A lista de serviços não pode conter IDs duplicados.")
        return v

    model_config = ConfigDict(extra="forbid")


# --- Contratos de Saída (Responses) ---
class AgendamentoResponse(BaseModel):
    """
    Especificação Técnica para RESPOSTA DETALHADA:
    Retorna os campos base + lista de serviços vinculados + atributos do servidor.
    """

    id: int
    cliente_id: int
    barbeiro_id: int
    data_agendamento: datetime
    data_criacao: datetime = Field(..., description="Data de registro no sistema")
    status: str = Field(
        ...,
        max_length=20,
        description="Status atual (pendente, confirmado, concluido, cancelado)",
    )
    observacoes: str | None = Field(None, max_length=500, description="Notas extras")
    pago: bool = Field(default=False)

    # Lista dos serviços vinculados (substituiu o antigo servico_id)
    servicos: List[ServicoSimples] = Field(
        default_factory=list, description="Serviços vinculados ao agendamento"
    )

    # Campos de feedback interno (e-mail)
    msg: Optional[str] = Field(None, description="Mensagem de retorno para o payload")
    status_email: Optional[str] = Field(
        None, description="Status para sabermos se o e-mail foi enviado ou não"
    )

    model_config = ConfigDict(from_attributes=True)


class AgendamentoListResponse(BaseModel):
    """
    Especificação Técnica para LISTAGEM:
    Encapsula uma lista de objetos para permitir expansão futura (paginação).
    """

    pagina: int = Field(..., description="Página atual")
    per_page: int = Field(..., description="Itens por página")
    total: int = Field(..., description="Total de itens")
    total_paginas: int = Field(..., description="Total de páginas")
    tem_proxima: bool = Field(..., description="Tem próxima página?")
    tem_pagina_anterior: bool = Field(..., description="Tem página anterior?")

    items: List[AgendamentoResponse] = Field(..., description="Lista de agendamentos")

    model_config = ConfigDict(from_attributes=True)


class AgendamentoUpdateSchema(BaseModel):
    """
    Schema para atualização parcial (PATCH).
    Todos os campos são opcionais para permitir que apenas
    os dados enviados sejam processados.
    Quando servico_ids é enviado, a lista substitui completamente os serviços anteriores.
    """

    data_agendamento: Optional[datetime] = None
    barbeiro_id: Optional[int] = Field(None, gt=0)
    servico_ids: Optional[List[int]] = Field(
        None, description="Nova lista completa de serviços (substituição total)"
    )
    cliente_id: Optional[int] = Field(None, gt=0)
    observacoes: Optional[str] = Field(None, max_length=500)

    @field_validator("servico_ids")
    @classmethod
    def validar_servico_ids(cls, v):
        if v is None:
            return v
        if len(v) == 0:
            raise ValueError("A lista de serviços não pode ser vazia ao atualizar.")
        if any(sid <= 0 for sid in v):
            raise ValueError("Todos os IDs de serviço devem ser maiores que zero.")
        if len(v) != len(set(v)):
            raise ValueError("A lista de serviços não pode conter IDs duplicados.")
        return v

    model_config = ConfigDict(extra="forbid", from_attributes=True)


class AgendamentoUpdateStatusSchema(BaseModel):
    # Josue - 22/04/2026: admin deve informar explicitamente estado de pagamento ao concluir.
    status: str = Field(
        ...,
        max_length=20,
        description="Status atual (pendente, confirmado, concluido, cancelado)",
    )
    pago: Optional[bool] = Field(
        None,
        description="Se o agendamento foi pago no momento da conclusão",
    )
    forma_pagamento: Optional[str] = Field(
        None,
        description="Forma de pagamento (dinheiro, pix, credito, debito)",
    )
    comissao_pct: float = Field(
        50.0,
        ge=0,
        le=100,
        description="Percentual de comissão aplicado na transação financeira",
    )

    @field_validator("forma_pagamento")
    @classmethod
    def validar_forma_pagamento(cls, v):
        if v is None:
            return v
        forma_normalizada = v.strip().lower()
        formas_validas = {"dinheiro", "pix", "credito", "debito"}
        if forma_normalizada not in formas_validas:
            raise ValueError(
                "forma_pagamento inválida. Use: dinheiro, pix, credito ou debito."
            )
        return forma_normalizada

    @model_validator(mode="after")
    def validar_regras_pagamento(self):
        # Josue - 22/04/2026: evita concluir sem decisão de pagamento e garante consistência de forma_pagamento.
        status_normalizado = self.status.strip().lower()
        if status_normalizado == "concluido":
            if self.pago is None:
                raise ValueError(
                    "Ao concluir o agendamento, informe explicitamente se foi pago."
                )
            if self.pago and not self.forma_pagamento:
                raise ValueError(
                    "Ao informar pago=true, a forma_pagamento é obrigatória."
                )
            if not self.pago and self.forma_pagamento:
                raise ValueError(
                    "Não informe forma_pagamento quando pago=false."
                )
        return self

    model_config = ConfigDict(from_attributes=True, extra="forbid")
