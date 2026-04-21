# Vinicius - 08/04/2026
# Criação do arquivo de schema para o cliente

from pydantic import BaseModel, Field, EmailStr, field_validator
import re


class ClienteSchema(BaseModel):
    nome: str = Field(
        ..., min_length=3, max_length=100, description="Nome completo do cliente"
    )
    telefone: str = Field(
        ...,
        description="Telefone do cliente (apenas números e símbolos básicos)",
    )
    email: EmailStr = Field(
        ..., min_length=10, max_length=100, description="E-mail do cliente"
    )
    senha: str = Field(
        ...,
        min_length=6,
        max_length=256,
        description="Senha do cliente (mínimo 6 caracteres)",
    )

    model_config = {"extra": "forbid"}

    @field_validator("nome", mode="before")
    @classmethod
    def str_validator(cls, value):
        if isinstance(value, str):
            return value.lower()
        return value

    @field_validator("telefone", mode="before")
    @classmethod
    def validar_telefone(cls, value):
        if not value: return value
        # Remove caracteres comuns de máscara para validar apenas os números
        numeros = re.sub(r"\D", "", str(value))
        numeros = numeros.strip()

        # Validação: Um telefone brasileiro tem entre 10 (fixo) e 11 (celular) dígitos
        if not (10 <= len(numeros) <= 11):
            raise ValueError("O telefone deve conter entre 10 e 11 dígitos (com DDD)")

        return numeros


# Vinicius - 08/04/2026
# Herda de ClienteSchema para reutilizar validações
class ClienteUpdateSchema(BaseModel):
    nome: str | None = Field(
        default=None, min_length=3, max_length=100, description="Nome do serviço"
    )
    telefone: str | None = Field(
        default=None, min_length=10, max_length=20, description="Telefone do serviço"
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
    # Ian - 19/04/2026
    # Adiciona status do cliente (ativo, ausente, devedor)
    status: str | None = Field(
        default=None, 
        pattern="^(ativo|ausente|devedor)$",
        description="Status do cliente: ativo, ausente ou devedor"
    )

    # Adiciona divida total do cliente
    divida_total: float | None = Field(
        default=None,
        ge=0.0,
        description="Total em dívida do cliente"
    )

    # Adicionado 'extra': 'forbid' para que o campo não aceite campos extras
    # Vinicius - 09/04/2026
    # Removido o str_lowercase devido que poderia dar problemas (ex: deixar caracteres da senha em minúsculo)
    model_config = {"extra": "forbid"}

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

        # Remove os espaços em branco, caso tenha, do telefone
        value = value.strip()

        # Opcional: Você pode retornar apenas os números limpos para o banco
        return numeros
