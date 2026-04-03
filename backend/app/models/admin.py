from app import db
from datetime import datetime
from app.models.mixins import HashSenhaMixin

class Admin(HashSenhaMixin,db.Model):
    """Modelo de Admin - usuários que gerenciam a barbearia"""
    
    __tablename__ = 'admins'
    
    # Níveis de permissão
    ROLE_ADMIN = 'admin'
    ROLE_GERENTE = 'gerente'
    
    # Colunas
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)  # Senha SEMPRE hasheada!
    role = db.Column(db.String(20), default=ROLE_GERENTE)  # admin ou gerente
    ativo = db.Column(db.Boolean, default=True)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    ultimo_login = db.Column(db.DateTime)  # Último acesso
    
    def __repr__(self):
        return f'<Admin {self.email}>'
