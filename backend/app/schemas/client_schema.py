# Vinicius - 08/04/2026
# Criação do arquivo de schema para o cliente

from pydantic import BaseModel, Field, EmailStr, field_validator
import re


class ClienteSchema(BaseModel):
    nome: str = Field(..., max_length=100, description="Nome completo do cliente")
    telefone: str = Field(
        ...,
        max_length=20,
        description="Telefone do cliente (apenas números e símbolos básicos)",
    )
    email: EmailStr = Field(..., max_length=100, description="E-mail do cliente")
    senha: str = Field(
        ..., min_length=6, description="Senha do cliente (mínimo 6 caracteres)"
    )

    model_config = {"extra": "forbid", "str_lowercase": True}

    @field_validator("nome", mode="before")
    @classmethod
    def str_validator(cls, value):
        if isinstance(value, str):
            return value.lower()
        return value

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, value):
        if not re.match(r"^[\d\s\+\-\(\)]+$", value):
            raise ValueError(
                "Telefone inválido (deve conter apenas números e símbolos como +, -, (), espaços)"
            )
        return value
