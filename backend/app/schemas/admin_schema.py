# Vinicius - 08/04/2026
# Criação do arquivo de schema para o admin

from pydantic import BaseModel, Field, EmailStr, field_validator


class AdminSchema(BaseModel):
    nome: str = Field(..., max_length=100, description="Nome do administrador")
    email: EmailStr = Field(..., max_length=100, description="E-mail do administrador")
    senha: str = Field(
        ..., min_length=6, description="Senha de acesso do administrador"
    )
    role: str = Field(
        default="gerente",
        max_length=20,
        description="Nível de permissão (admin ou gerente)",
    )
    ativo: bool = Field(default=True, description="Status da conta (ativo ou inativo)")

    model_config = {"extra": "forbid", "str_lowercase": True}

    @field_validator("nome", "role", mode="before")
    @classmethod
    def str_validator(cls, value):
        if isinstance(value, str):
            return value.lower()
        return value

    @field_validator("role")
    @classmethod
    def validar_role(cls, value):
        if value not in ["admin", "gerente"]:
            raise ValueError("A role deve ser 'admin' ou 'gerente'")
        return value
