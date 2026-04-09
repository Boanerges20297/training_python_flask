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

    @field_validator("telefone", mode="before")
    @classmethod
    def validar_telefone(cls, value):
        # Remove caracteres comuns de máscara para validar apenas os números
        numeros = re.sub(r"\D", "", value)

        # Validação: Um telefone brasileiro tem entre 10 (fixo) e 11 (celular) dígitos
        if not (10 <= len(numeros) <= 11):
            raise ValueError("O telefone deve conter entre 10 e 11 dígitos (com DDD)")

        # Opcional: Você pode retornar apenas os números limpos para o banco
        return numeros


# Vinicius - 08/04/2026
# Herda de ClienteSchema para reutilizar validações
class ClienteUpdateSchema(BaseModel):
    nome: str | None = Field(
        default=None, min_length=3, max_length=100, description="Nome do serviço"
    )
    telefone: str | None = Field(
        default=None, min_length=11, max_length=20, description="Telefone do serviço"
    )
    email: EmailStr | None = Field(
        default=None, min_length=10, max_length=100, description="Email do serviço"
    )
    senha: str | None = Field(
        default=None,
        min_length=6,
        max_length=100,
        description="Senha do serviço (mínimo 6 caracteres)",
    )

    # Adicionado 'extra': 'forbid' para que o campo não aceite campos extras
    # Adicionado 'str_lowercase': True para que o campo string seja convertido para minúsculo
    model_config = {"extra": "forbid", "str_lowercase": True}

    # Adicionado 'str_validator' para validar os campos string, fazendo com que todos os campos string sejam convertidos para minúsculo
    @field_validator("nome", mode="before")
    @classmethod
    def str_validator(cls, value):
        return value.lower()

    @field_validator("telefone", mode="before")
    @classmethod
    def validar_telefone(cls, value):
        if value is None:
            return value

        # Remove caracteres comuns de máscara para validar apenas os números
        numeros = re.sub(r"\D", "", value)

        # Validação: Um telefone brasileiro tem entre 10 (fixo) e 11 (celular) dígitos
        if not (10 <= len(numeros) <= 11):
            raise ValueError("O telefone deve conter entre 10 e 11 dígitos (com DDD)")

        # Opcional: Você pode retornar apenas os números limpos para o banco
        return numeros
