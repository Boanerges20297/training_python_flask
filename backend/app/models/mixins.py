#josue inicio
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class HashSenhaMixin:
    """Mixin para adicionar senha hash aos modelos"""
    #Vinicius - 04/04/2026
    #Senha hash adicionada para ser responsabilidade do mixin
    senha_hash = db.Column(db.String(256), nullable=False)
    
    @property
    def senha(self):
        raise AttributeError('A senha não é um atributo legível')

    @senha.setter
    def senha(self, senha_texto_simples):
        self.senha_hash = generate_password_hash(senha_texto_simples)

    def verificar_senha(self, senha_texto_simples):
        return check_password_hash(self.senha_hash, senha_texto_simples)
#josue fim