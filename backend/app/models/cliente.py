# Ian - 19/04/2026
# Adicionando status de cliente e histórico de débitos

from app import db
from datetime import datetime
from app.models.mixins import HashSenhaMixin
#josue minima alteracao
class Cliente(HashSenhaMixin, db.Model):
    """Modelo de Cliente - pessoa que marca agendamentos"""

    __tablename__ = 'clientes'
    
    # Estados possíveis do cliente
    STATUS_ATIVO = "ativo"
    STATUS_AUSENTE = "ausente"
    STATUS_DEVEDOR = "devedor"
    
    # Colunas
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    #Vinicius
    #Senha hash removida para ser gerenciada pelo Mixin
    
    # Ian - 19/04/2026
    # Status do cliente (ativo, ausente, devedor)
    status = db.Column(db.String(20), default=STATUS_ATIVO)

    # Total em débito do cliente
    divida_total = db.Column(db.Float, default=0.0)
  
    # Data da última visita (agendamento concluído)
    ultima_visita = db.Column(db.DateTime, nullable=True)
    
    # Novos campos de integracao
    imagem_url = db.Column(db.Text, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos (vamos usar depois)
    agendamentos = db.relationship('Agendamento', backref='cliente', lazy=True)


    def __repr__(self):
        return f'<Cliente {self.nome}>'
