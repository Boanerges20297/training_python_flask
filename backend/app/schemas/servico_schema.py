#Vinicius 03/04/2026

from pydantic import BaseModel, Field, field_validator

class ServicoSchema(BaseModel):
    nome: str = Field(..., max_length=100, description="Nome do serviço")
    descricao: str = Field(default="", description="Descrição do serviço")
    preco: float = Field(..., description="Preço do serviço")
    duracao_minutos: int = Field(..., description="Duração do serviço em minutos")
    barbeiro_id: int = Field(..., description="ID do barbeiro")

    model_config = {
        "extra": "forbid",
        "str_lowercase": True
    }

    #Validador para todos os campos str terem letras minusculas
    @field_validator('nome', 'descricao', mode='before')
    @classmethod
    def str_validator(cls, value):
        return value.lower()

