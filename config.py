import os
from datetime import timedelta

# Pega o caminho da raiz do projeto
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Configurações gerais da aplicação"""
    
    # SQLite - banco de dados local em arquivo
    # sqlite:/// significa que está na mesma pasta do projeto
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{BASE_DIR}/barba_byte.db'
    
    # Desabilita avisos desnecessários
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Chave secreta para sessões e cookies (importante!)
    # Em produção, use uma chave forte gerada aleatoriamente
    SECRET_KEY = os.environ.get('vsmm04994mSKKFIeieio3kl') or 'dev-key-mudar-em-producao'
    
    # Tempo de sessão (quanto tempo fica logado sem atividade)
    PERMANENT_SESSION_LIFETIME = timedelta(days=3)
    
    # JSON - configurações para respostas JSON
    JSON_SORT_KEYS = False  # Não ordena as chaves (mais legível)
