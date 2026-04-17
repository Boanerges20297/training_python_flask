# Vinicius 10/04/2026
# Arquivo extensions para gerenciar extensões do app (db, jwt, etc)

from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from app.utils.ratelimiter import get_usuario_ou_ip
from config import DevelopmentConfig, ProductionConfig
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mailman import Mail

import logging

jwt = JWTManager()
cors = CORS()
db = SQLAlchemy()
# felipe
mail = Mail()
app_logger = logging.getLogger("barbabyte")
limiter = Limiter(
    key_func=get_usuario_ou_ip,
    storage_uri=DevelopmentConfig.RATELIMIT_STORAGE_URL,
    strategy=DevelopmentConfig.RATELIMIT_STRATEGY,
    headers_enabled=DevelopmentConfig.RATELIMIT_HEADERS_ENABLED,
    default_limits=DevelopmentConfig.RATELIMIT_DEFAULT_LIMIT,
)
mail = Mail()
