#Vinicius - 03/04/2026

from pydantic import BaseModel, Field, field_validator, FutureDatetime, ValidationError
from datetime import datetime

#  # Colunas
#     id = db.Column(db.Integer, primary_key=True)
    
#     # Chaves estrangeiras
#     cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
#     barbeiro_id = db.Column(db.Integer, db.ForeignKey('barbeiros.id'), nullable=False)
#     servico_id = db.Column(db.Integer, db.ForeignKey('servicos.id'), nullable=False)
    
#     # Data e hora do agendamento
#     data_agendamento = db.Column(db.DateTime, nullable=False)  # Quando será feito
#     data_criacao = db.Column(db.DateTime, default=datetime.utcnow)  # Quando foi marcado
    
#     # Status do agendamento
#     status = db.Column(db.String(20), default=STATUS_PENDENTE)  # pendente, confirmado, cancelado, concluido
    
#     # Observações (por exemplo: "Alergia a certos produtos")
#     observacoes = db.Column(db.Text)
    
#     def __repr__(self):

HORARIO_INICIO = 8
HORARIO_FECHAMENTO = 20

class AgendamentoSchema(BaseModel):
    cliente_id: int = Field(..., description="ID do cliente")
    barbeiro_id: int = Field(..., description="ID do barbeiro")
    servico_id: int = Field(..., description="ID do serviço")
    data_agendamento: FutureDatetime = Field(..., description="Data e hora do agendamento")
    data_criacao: FutureDatetime = Field(default_factory=datetime.utcnow, description="Data e hora da criação do agendamento")
    status: str = Field(max_length=20, default='pendente', description="Status do agendamento")
    observacoes: str = Field(description="Observações do agendamento")

    model_config = {
        "extra": "forbid",
        "str_lowercase": True
    }

    @field_validator('data_agendamento')
    def data_agendamento_validator(cls, value):
        #Vinicius - 03/04/2026
        #Se a data de inicio for maior que o horario de fechamento, retornar erro
        if value.hour < HORARIO_INICIO or value.hour >= HORARIO_FECHAMENTO:
            raise ValidationError('Barbearia fechada neste horario')
        
        return value

    @field_validator('status')
    def status_validator(cls, value):
        if value not in ['pendente', 'confirmado', 'cancelado', 'concluido']:
            raise ValidationError('Status inválido')
        return value

    #Validador para todos os campos str terem letras minusculas
    @field_validator('observacoes', mode='before')
    @classmethod
    def str_validator(cls, value):
        return value.lower()
    
    

