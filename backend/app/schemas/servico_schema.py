# Vinicius 03/04/2026
# Criação do arquivo de schema para o serviço

from pydantic import BaseModel, Field, field_validator


class ServicoSchema(BaseModel):
    # Vinicius - 05/04/2026
    # Adicionado '...' para que os campos sejam obrigatórios
    # Adicionado 'description' para que o campo seja documentado
    # Adicionado 'max_length' para que o campo nome tenha no máximo 100 caracteres
    # Adicionado 'default' para que o campo descricao tenha um valor padrão
    nome: str = Field(..., min_length=3, max_length=100, description="Nome do serviço")
    descricao: str = Field(default="", description="Descrição do serviço")
    preco: float = Field(..., gt=0, description="Preço do serviço (maior que zero)")
    duracao_minutos: int = Field(
        ..., gt=0, description="Duração do serviço em minutos (maior que zero)"
    )

    # Vinicius - 05/04/2026
    # Adicionado 'extra': 'forbid' para que o campo não aceite campos extras
    # Adicionado 'str_lowercase': True para que o campo string seja convertido para minúsculo
    model_config = {"extra": "forbid", "str_lowercase": True}

    # Vinicius - 05/04/2026
    # Adicionado 'str_validator' para validar os campos string, fazendo com que todos os campos string sejam convertidos para minúsculo
    @field_validator("nome", "descricao", mode="before")
    @classmethod
    def str_validator(cls, value):
        return value.lower()


# Vinicius - 08/04/2026
# Classe para atualizar o serviço
class ServicoUpdateSchema(BaseModel):
    nome: str | None = Field(
        default=None, min_length=3, max_length=100, description="Nome do serviço"
    )
    descricao: str | None = Field(
        default=None, min_length=3, description="Descrição do serviço"
    )
    preco: float | None = Field(
        default=None, gt=0, description="Preço do serviço (maior que zero)"
    )
    duracao_minutos: int | None = Field(
        default=None, gt=0, description="Duração do serviço em minutos (maior que zero)"
    )

    # Adicionado 'extra': 'forbid' para que o campo não aceite campos extras
    # Adicionado 'str_lowercase': True para que o campo string seja convertido para minúsculo
    model_config = {"extra": "forbid", "str_lowercase": True}

    # Adicionado 'str_validator' para validar os campos string, fazendo com que todos os campos string sejam convertidos para minúsculo
    @field_validator("nome", "descricao", mode="before")
    @classmethod
    def str_validator(cls, value):
        return value.lower()
