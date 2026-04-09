# Vinicius - 08/04/2026
# Criação do arquivo de schema para o admin

from pydantic import BaseModel, Field, EmailStr, field_validator


class AdminSchema(BaseModel):
    nome: str = Field(
        ..., min_length=3, max_length=100, description="Nome do administrador"
    )
    email: EmailStr = Field(
        ..., min_length=10, max_length=100, description="E-mail do administrador"
    )
    senha: str = Field(
        ...,
        min_length=6,
        max_length=256,
        description="Senha de acesso do administrador",
    )

    role: str = Field(
        default="gerente",
        max_length=10,
        description="Nível de permissão (admin ou gerente)",
    )

    model_config = {"extra": "forbid", "str_lowercase": True}

    @field_validator("nome", mode="before")
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
