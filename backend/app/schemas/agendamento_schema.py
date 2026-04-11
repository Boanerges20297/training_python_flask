from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional


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
    servico_id: int = Field(..., gt=0, description="ID único do serviço")


# --- Contratos de Entrada (Inputs) ---
class AgendamentoCreate(AgendamentoBase):
    """
    Especificação Técnica para CRIAÇÃO:
    Recebe os campos base + dados específicos de quem está agendando.
    """

    cliente_id: int = Field(..., gt=0)
    observacoes: Optional[str] = Field(None, max_length=500, description="Notas extras")

    model_config = ConfigDict(extra="forbid")


# --- Contratos de Saída (Responses) ---
class AgendamentoResponse(AgendamentoBase):
    """
    Especificação Técnica para RESPOSTA DETALHADA:
    Retorna os campos base + atributos gerados pelo servidor (ID e Status).
    """

    id: int
    status: str = Field(
        ...,
        max_length=20,
        description="Status atual (pendente, confirmado, concluido, cancelado)",
    )
    data_criacao: datetime = Field(..., description="Data de registro no sistema")

    model_config = ConfigDict(from_attributes=True)


class AgendamentoListResponse(BaseModel):
    """
    Especificação Técnica para LISTAGEM:
    Encapsula uma lista de objetos para permitir expansão futura (paginação).
    """

    page: int = Field(..., description="Página atual")
    per_page: int = Field(..., description="Itens por página")

    has_next: bool = Field(..., description="Tem próxima página?")
    has_prev: bool = Field(..., description="Tem página anterior?")

    data: List[AgendamentoResponse] = Field(..., description="Lista de agendamentos")

    model_config = ConfigDict(from_attributes=True)


class AgendamentoUpdateSchema(BaseModel):
    """
    Schema para atualização parcial (PATCH).
    Todos os campos são opcionais para permitir que apenas
    os dados enviados sejam processados.
    """

    data_agendamento: Optional[datetime] = None
    barbeiro_id: Optional[int] = Field(None, gt=0)
    servico_id: Optional[int] = Field(None, gt=0)
    cliente_id: Optional[int] = Field(None, gt=0)
    observacoes: Optional[str] = Field(None, max_length=500)

    model_config = ConfigDict(extra="forbid", from_attributes=True)


class AgendamentoUpdateStatusSchema(BaseModel):
    status: str = Field(
        ...,
        max_length=20,
        description="Status atual (pendente, confirmado, concluido, cancelado)",
    )
    model_config = ConfigDict(from_attributes=True)
