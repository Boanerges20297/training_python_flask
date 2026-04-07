from app import db
from datetime import datetime
from app.models.mixins import HashSenhaMixin
#josue minima alteracao
class Barbeiro(HashSenhaMixin, db.Model):
    """Modelo de Barbeiro - profissional que oferece serviços"""
    
    __tablename__ = 'barbeiros'
    
    # Colunas
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    especialidade = db.Column(db.String(100))  # Ex: "Corte clássico", "Barba"
    email = db.Column(db.String(100), unique=True, nullable=False)
    telefone = db.Column(db.String(20), nullable=False)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    ativo = db.Column(db.Boolean, default=True)  # Se está trabalhando
    #Vinicius
    #Senha hash removida para ser gerenciada pelo Mixin
    # Relacionamentos
    agendamentos = db.relationship('Agendamento', backref='barbeiro', lazy=True)
    servicos = db.relationship('Servico', backref='barbeiro', lazy=True)
    
    def __repr__(self):
        return f'<Barbeiro {self.nome}>'
