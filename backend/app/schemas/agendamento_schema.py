# Vinicius - 03/04/2026
# Criação do arquivo de schema para o agendamento

from pydantic import BaseModel, Field, field_validator, FutureDatetime
from datetime import datetime

HORARIO_INICIO = 8
HORARIO_FECHAMENTO = 20


class AgendamentoSchema(BaseModel):
    # Vinicius - 05/04/2026
    # Adicionado '...' para que os campos sejam obrigatórios
    # Adicionado 'description' para que o campo seja documentado
    # Adicionado 'FutureDatetime' para que a data seja no futuro
    # Adicionado 'default_factory' para que a data de criação seja a data atual
    # Adicionado 'max_length' para que o campo status tenha no máximo 20 caracteres
    cliente_id: int = Field(..., description="ID do cliente")
    barbeiro_id: int = Field(..., description="ID do barbeiro")
    servico_id: int = Field(..., description="ID do serviço")
    data_agendamento: FutureDatetime = Field(
        ..., description="Data e hora do agendamento"
    )
    data_criacao: FutureDatetime = Field(
        default_factory=datetime.utcnow,
        description="Data e hora da criação do agendamento",
    )
    status: str = Field(
        max_length=20, default="pendente", description="Status do agendamento"
    )
    observacoes: str = Field(description="Observações do agendamento")

    # Vinicius - 05/04/2026
    # Adicionado 'extra': 'forbid' para que o campo não aceite campos extras
    # Adicionado 'str_lowercase': True para que o campo string seja convertido para minúsculo
    model_config = {"extra": "forbid", "str_lowercase": True}

    # Vinicius - 05/04/2026
    # Adicionado 'data_agendamento_validator' para validar a data de agendamento
    @field_validator("data_agendamento")
    @classmethod
    def data_agendamento_validator(cls, value):
        # Vinicius - 03/04/2026
        # Se a data de inicio for maior que o horario de fechamento, retornar erro
        if value.hour < HORARIO_INICIO or value.hour >= HORARIO_FECHAMENTO:
            raise ValueError("Barbearia fechada neste horario")

        return value

    # Vinicius - 05/04/2026
    # Adicionado 'status_validator' para validar os status recebidos no agendamento
    @field_validator("status")
    @classmethod
    def status_validator(cls, value):
        if value not in ["pendente", "confirmado", "cancelado", "concluido"]:
            raise ValueError("Status inválido")
        return value

    # Vinicius - 05/04/2026
    # Adicionado 'str_validator' para validar os campos string, fazendo com que todos os campos string sejam convertidos para minúsculo
    @field_validator("observacoes", mode="before")
    @classmethod
    def str_validator(cls, value):
        return value.lower()
