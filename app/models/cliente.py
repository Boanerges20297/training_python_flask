from app import db
from datetime import datetime

class Cliente(db.Model):
    """Modelo de Cliente - pessoa que marca agendamentos"""
    
    __tablename__ = 'clientes'
    
    # Colunas
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos (vamos usar depois)
    agendamentos = db.relationship('Agendamento', backref='cliente', lazy=True)
    
    def __repr__(self):
        return f'<Cliente {self.nome}>'
