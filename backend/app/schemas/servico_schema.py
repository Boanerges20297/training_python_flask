#Vinicius 03/04/2026

from pydantic import BaseModel, Field, field_validator

# class Servico(db.Model):
#     """Modelo de Serviço - serviços oferecidos pela barbearia"""
    
#     __tablename__ = 'servicos'
    
#     # Colunas
#     id = db.Column(db.Integer, primary_key=True)
#     nome = db.Column(db.String(100), nullable=False)
#     descricao = db.Column(db.Text)  # Descrição detalhada
#     preco = db.Column(db.Float, nullable=False)  # Em reais
#     duracao_minutos = db.Column(db.Integer, nullable=False)  # Quanto tempo leva
    
#     # Chave estrangeira - qual barbeiro oferece este serviço
#     barbeiro_id = db.Column(db.Integer, db.ForeignKey('barbeiros.id'), nullable=False)
    
#     # Relacionamentos
#     agendamentos = db.relationship('Agendamento', backref='servico', lazy=True)
    
#     def __repr__(self):
#         return f'<Servico {self.nome}>'

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

