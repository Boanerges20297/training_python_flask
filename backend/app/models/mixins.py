#josue inicio
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class HashSenhaMixin:
    """Mixin para adicionar senha hash aos modelos"""
    
    @property
    def senha(self):
        raise AttributeError('A senha não é um atributo legível')

    @senha.setter
    def senha(self, senha_texto_simples):
        self.senha_hash = generate_password_hash(senha_texto_simples)

    def verificar_senha(self, senha_texto_simples):
        return check_password_hash(self.senha_hash, senha_texto_simples)
#josue fim