from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from datetime import datetime
from typing import Optional, List


# --- Campos Compartilhados ---
class AdminBase(BaseModel):
    """
    Campos comuns para entrada e saída.
    A senha NUNCA deve estar aqui para evitar vazamentos.
    """

    nome: str = Field(
        ..., min_length=3, max_length=100, description="Nome do administrador"
    )
    email: EmailStr = Field(..., description="E-mail do administrador")
    role: str = Field(
        default="gerente",
        max_length=10,
        description="Nível de permissão (admin ou gerente)",
    )
    ativo: bool = Field(default=True, description="Status de acesso")

    @field_validator("nome", "role", mode="before")
    @classmethod
    def str_validator(cls, value):
        if isinstance(value, str):
            return value.lower()
        return value

    @field_validator("role", mode="after")
    @classmethod
    def validar_role(cls, value):
        if value not in ["admin", "gerente"]:
            raise ValueError("A role deve ser 'admin' ou 'gerente'")
        return value


# --- Contrato de Criação (POST) ---
class AdminCreate(AdminBase):
    """
    Schema exclusivo para criação.
    A senha é obrigatória.
    """

    senha: str = Field(
        ..., min_length=6, max_length=256, description="Senha em texto plano"
    )

    model_config = ConfigDict(extra="forbid")


# --- Contrato de Edição (PATCH) ---
class AdminUpdate(BaseModel):
    """
    Schema para atualização parcial. Tudo é opcional.
    """

    nome: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, max_length=10)
    ativo: Optional[bool] = None
    senha: Optional[str] = Field(None, min_length=6, max_length=256)

    model_config = ConfigDict(extra="forbid")

    @field_validator("nome", "role", mode="before")
    @classmethod
    def str_validator_update(cls, value):
        # Só transforma em minúsculo se o valor foi enviado
        if value is not None and isinstance(value, str):
            return value.lower()
        return value

    @field_validator("role", mode="after")
    @classmethod
    def validar_role_update(cls, value):
        if value is not None and value not in ["admin", "gerente"]:
            raise ValueError("A role deve ser 'admin' ou 'gerente'")
        return value


# --- Contrato de Saída (GET / Resposta) ---
class AdminResponse(AdminBase):
    """
    Schema de resposta.
    Retorna os dados base + dados gerados pelo banco.
    NÃO CONTÉM SENHA.
    """

    id: int
    data_criacao: datetime = Field(
        ..., description="Data e hora em que o registro foi criado"
    )
    ultimo_login: Optional[datetime] = Field(
        None, description="Data e hora do último acesso ao sistema"
    )

    model_config = ConfigDict(from_attributes=True)


# --- Contrato de Listagem ---
class AdminListResponse(BaseModel):
    """
    Especificação Técnica para LISTAGEM PAGINADA.
    """

    page: int = Field(..., description="Página atual")
    per_page: int = Field(..., description="Itens por página")
    has_next: bool = Field(..., description="Tem próxima página?")
    has_prev: bool = Field(..., description="Tem página anterior?")
    data: List[AdminResponse] = Field(..., description="Lista de administradores")

    model_config = ConfigDict(from_attributes=True)
