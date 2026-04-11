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

    # Variavel para configurar o limite padrão de requisições por minuto
    RATELIMIT_DEFAULT_LIMIT = "3/minute"
    # Variavel para configurar a estratégia do rate limiter
    RATELIMIT_STRATEGY = "fixed-window"
    # Variavel para configurar se os headers do rate limiter devem ser habilitados
    RATELIMIT_HEADERS_ENABLED = True

    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_ACCESS_COOKIE_PATH = "/"
    JWT_REFRESH_COOKIE_PATH = "/api/auth/refresh"

    HORARIO_ABERTURA = 8
    HORARIO_FECHAMENTO = 20


class DevelopmentConfig(Config):
    """Configurações de desenvolvimento"""

    DEBUG = True

    SQLALCHEMY_DATABASE_URI = (
        f'sqlite:///{os.path.join(BASE_DIR, "instances", "barba_byte.db")}'
    )

    FRONTEND_URL = "*"

    # Variavel para habilitar/desabilitar o rate limiter
    RATELIMIT_ENABLED = False
    RATELIMIT_STORAGE_URL = "memory://"
    # Desabilitar verificação de payload:
    VALIDATE_PAYLOAD = False

    SECURITY_JWT_ENABLED = False
    JWT_COOKIE_SAMESITE = "Lax"
    JWT_COOKIE_SECURE = False
    JWT_SECRET_KEY = "chave-secreta-do-jwt-mudar-em-producao"
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=999)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=999)

    SECRET_KEY = "chave-secreta"


class ProductionConfig(Config):
    """Configurações de produção"""

    DEBUG = False
    # Variavel para habilitar/desabilitar o rate limiter

    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

    FRONTEND_URL = os.environ.get("FRONTEND_URL")

    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = os.environ.get("REDIS_URL")

    VALIDATE_PAYLOAD = True

    SECURITY_JWT_ENABLED = True
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_SAMESITE = "Strict"
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    SECRET_KEY = os.environ.get("SECRET_KEY")
