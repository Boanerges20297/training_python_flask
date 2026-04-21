# Vinicius - 08/04/2026
# Criação do arquivo de schema para o barbeiro

from pydantic import BaseModel, Field, EmailStr, field_validator
import re
from typing import List


class BarbeiroSchema(BaseModel):
    nome: str = Field(..., max_length=100, description="Nome completo do barbeiro")
    especialidade: str = Field(
        default="",
        max_length=100,
        description="Especialidade do barbeiro (ex: degrade, reflexo)",
    )
    email: EmailStr = Field(..., max_length=100, description="E-mail do barbeiro")
    telefone: str = Field(
        ..., min_length=10, max_length=20, description="Telefone de contato do barbeiro"
    )
    senha: str = Field(..., min_length=6, description="Senha de acesso do barbeiro")
    ativo: bool = Field(default=True, description="Se o barbeiro está ativo no sistema")

    model_config = {"extra": "forbid"}

    @field_validator("nome", "especialidade", mode="before")
    @classmethod
    def str_validator(cls, value):
        if isinstance(value, str):
            return value.lower()
        return value

    @field_validator("telefone", mode="before")
    @classmethod
    def validar_telefone(cls, value):
        if not value:
            return value
        # Remove caracteres comuns de máscara para validar apenas os números
        value = re.sub(r"\D", "", value)
        value = value.strip()

        if not (10 <= len(value) <= 11):
            raise ValueError("O telefone deve conter entre 10 e 11 dígitos (com DDD)")

        return value


class BarbeiroUpdateSchema(BaseModel):
    nome: str | None = Field(
        default=None,
        min_length=3,
        max_length=100,
        description="Nome completo do barbeiro",
    )
    especialidade: str | None = Field(
        default=None,
        min_length=3,
        max_length=100,
        description="Especialidade do barbeiro (ex: degrade, reflexo)",
    )
    email: EmailStr | None = Field(
        default=None, min_length=10, max_length=100, description="E-mail do barbeiro"
    )
    telefone: str | None = Field(
        default=None,
        description="Telefone de contato do barbeiro",
    )
    senha: str | None = Field(
        default=None,
        min_length=6,
        max_length=256,
        description="Senha de acesso do barbeiro",
    )
    ativo: bool | None = Field(
        default=None, description="Se o barbeiro está ativo no sistema"
    )

    # Vinicius - 09/04/2026
    # Removido o str_lowercase devido que poderia dar problemas (ex: deixar caracteres da senha em minúsculo)
    model_config = {"extra": "forbid"}

    @field_validator("nome", "especialidade", mode="before")
    @classmethod
    def str_validator(cls, value):
        if isinstance(value, str):
            return value.lower()
        return value

    @field_validator("telefone", mode="before")
    @classmethod
    def validar_telefone(cls, value):
        # Remove caracteres comuns de máscara para validar apenas os números
        numeros = re.sub(r"\D", "", value)
        print(numeros)

        # Validação: Um telefone brasileiro tem entre 10 (fixo) e 11 (celular) dígitos
        if not (10 <= len(numeros) <= 11):
            raise ValueError("O telefone deve conter entre 10 e 11 dígitos (com DDD)")

        # Opcional: Você pode retornar apenas os números limpos para o banco
        return numeros


class ServicoRealizadoSchema(BaseModel):
    nome: str
    quantidade: int
    preco_unitario: float
    receita: float


class BarbeiroDesempenhoSchema(BaseModel):
    barbeiro_id: int
    barbeiro_nome: str
    total_agendamentos: int
    agendamentos_concluidos: int
    agendamentos_cancelados: int
    receita_total: float
    tempo_total_minutos: int
    servicos_realizados: List[ServicoRealizadoSchema] = Field(default_factory=list)
    taxa_conclusao: float
