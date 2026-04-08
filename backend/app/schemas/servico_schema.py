#Vinicius 03/04/2026

from pydantic import BaseModel, Field, field_validator

class ServicoSchema(BaseModel):
    #Vinicius - 05/04/2026
    #Adicionado '...' para que os campos sejam obrigatórios
    #Adicionado 'description' para que o campo seja documentado
    #Adicionado 'max_length' para que o campo nome tenha no máximo 100 caracteres
    #Adicionado 'default' para que o campo descricao tenha um valor padrão
    nome: str = Field(..., max_length=100, description="Nome do serviço")
    descricao: str = Field(default="", description="Descrição do serviço")
    preco: float = Field(..., description="Preço do serviço")
    duracao_minutos: int = Field(..., description="Duração do serviço em minutos")
    barbeiro_id: int = Field(..., description="ID do barbeiro")

    #Vinicius - 05/04/2026
    #Adicionado 'extra': 'forbid' para que o campo não aceite campos extras
    #Adicionado 'str_lowercase': True para que o campo string seja convertido para minúsculo
    model_config = {
        "extra": "forbid",
        "str_lowercase": True
    }

    #Vinicius - 05/04/2026
    #Adicionado 'str_validator' para validar os campos string, fazendo com que todos os campos string sejam convertidos para minúsculo
    @field_validator('nome', 'descricao', mode='before')
    @classmethod
    def str_validator(cls, value):
        return value.lower()

