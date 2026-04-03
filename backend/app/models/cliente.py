from app import db
from datetime import datetime
from app.models.mixins import HashSenhaMixin

class Cliente(HashSenhaMixin, db.Model):
    """Modelo de Cliente - pessoa que marca agendamentos"""

    __tablename__ = 'clientes'
    
    # Colunas
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)
    senha_hash = db.Column(db.String(256), nullable=False)
    # Relacionamentos (vamos usar depois)
    agendamentos = db.relationship('Agendamento', backref='cliente', lazy=True)


    def __repr__(self):
        return f'<Cliente {self.nome}>'
