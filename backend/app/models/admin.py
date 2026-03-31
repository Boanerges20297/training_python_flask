from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class Admin(db.Model):
    """Modelo de Admin - usuários que gerenciam a barbearia"""
    
    __tablename__ = 'admins'
    
    # Níveis de permissão
    ROLE_ADMIN = 'admin'
    ROLE_GERENTE = 'gerente'
    
    # Colunas
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(20), default=ROLE_GERENTE)  # admin ou gerente
    ativo = db.Column(db.Boolean, default=True)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    ultimo_login = db.Column(db.DateTime)  # Último acesso
    
    def set_senha(self, senha):
        """Define a senha (é hasheada automaticamente)"""
        self.senha_hash = generate_password_hash(senha)
    
    def verificar_senha(self, senha):
        """Compara senha digitada com a hasheada no banco"""
        return check_password_hash(self.senha_hash, senha)
    
    def __repr__(self):
        return f'<Admin {self.email}>'
