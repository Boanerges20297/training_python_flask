import os
from datetime import timedelta
from dotenv import load_dotenv

# Pega o caminho da raiz do projeto
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

load_dotenv()


class Config:
    """Configurações gerais da aplicação"""

    # SQLite - banco de dados local em arquivo no diretório instances
    # Usamos o caminho absoluto para garantir que o Flask encontre o arquivo
    SQLALCHEMY_DATABASE_URI = (
        f'sqlite:///{os.path.join(BASE_DIR, "instances", "barba_byte.db")}'
    )

    # Desabilita avisos desnecessários
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Tempo de sessão (quanto tempo fica logado sem atividade)
    PERMANENT_SESSION_LIFETIME = timedelta(days=3)

    # JSON - configurações para respostas JSON
    JSON_SORT_KEYS = False  # Não ordena as chaves (mais legível)

    # Vinicius - 02/04/2026
    # Configuração do Rate Limiter
    # Variavel para configurar o storage do rate limiter
    RATELIMIT_STORAGE_URL = "memory://"
    # Variavel para configurar o limite padrão de requisições por minuto
    RATELIMIT_DEFAULT_LIMIT = "3/minute"
    # Variavel para configurar a estratégia do rate limiter
    RATELIMIT_STRATEGY = "fixed-window"
    # Variavel para configurar se os headers do rate limiter devem ser habilitados
    RATELIMIT_HEADERS_ENABLED = True


class DevelopmentConfig(Config):
    """Configurações de desenvolvimento"""

    DEBUG = True
    # Variavel para habilitar/desabilitar o rate limiter
    RATELIMIT_ENABLED = False
    # Desabilitar verificação de payload:
    VALIDATE_PAYLOAD = False
    # Chave secreta para o JWT
    JWT_SECRET_KEY = "chave-secreta-do-jwt-mudar-em-producao"
    SECRET_KEY = "chave-secreta"


class ProductionConfig(Config):
    """Configurações de produção"""

    DEBUG = False
    # Variavel para habilitar/desabilitar o rate limiter
    RATELIMIT_ENABLED = True
    VALIDATE_PAYLOAD = True
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    SECRET_KEY = os.environ.get("SECRET_KEY")
