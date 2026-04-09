from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from app.utils.ratelimiter import get_usuario_ou_ip
from config import Config
from flask_jwt_extended import JWTManager

# Inicializa o banco de dados (vai ser usado pelos modelos)
# Criamos aqui, fora de qualquer função, para importar nos modelos
db = SQLAlchemy()

# Vinicius - 02/04/2026
# Inicializa o rate limiter
limiter = Limiter(
    key_func=get_usuario_ou_ip,
    storage_uri=Config.RATELIMIT_STORAGE_URL,
    strategy=Config.RATELIMIT_STRATEGY,
    headers_enabled=Config.RATELIMIT_HEADERS_ENABLED,
    default_limits=Config.RATELIMIT_DEFAULT_LIMIT,
)


def create_app():
    """
    FACTORY PATTERN - Cria e configura a aplicação Flask
    """
    import os

    # 1. Criar a app Flask
    # Definimos explicitamente o caminho da pasta de instância para o diretório "instances"
    app = Flask(
        __name__,
        instance_relative_config=True,
        instance_path=os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "instances")
        ),
    )

    # 1.1 Garantir que a pasta de instância exista
    try:
        if not os.path.exists(app.instance_path):
            os.makedirs(app.instance_path)
    except OSError:
        pass

    # 2. Carregar configurações do config.py
    from config import Config

    app.config.from_object(Config)

    # Vinicius - 02/04/2026
    # Inicializa o rate limiter
    if Config.RATELIMIT_ENABLED:
        limiter.init_app(app)

    # Vinicius - 02/04/2026
    # Funcao de erro para o rate limiter
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return (
            jsonify(
                {
                    "erro": "Limite de requisições excedido",
                    "mensagem": "Você excedeu o limite de requisições",
                    "detalhes": str(e.description),
                }
            ),
            429,
        )

    # felipe inicio
    # 2.1 configurar secret key do jwt
    jwt = JWTManager()
    jwt.init_app(app)
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    # felipe fim

    # 2.5 Habilitar CORS
    from flask_cors import CORS

    CORS(app)

    # 3. Inicializar banco de dados
    db.init_app(app)

    # 4. Registrar blueprints (Rotas Modulares)
    from app.routes.client_routes import clientes_bp
    from app.routes.servico_routes import servico_bp
    from app.routes.agendamento_routes import agendamento_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.tests_routes import tests_bp

    app.register_blueprint(clientes_bp)
    app.register_blueprint(servico_bp)
    app.register_blueprint(agendamento_bp)
    app.register_blueprint(auth_bp)
    # Vinicius - 02/04/2026
    # Se tiver em ambiente de desenvolvimento, importe tests_bp
    if Config.DEBUG == True:
        app.register_blueprint(tests_bp)

    # 5. Criar as tabelas no banco (quando a app inicia)
    with app.app_context():
        db.create_all()

    # 6. Rota básica para testar se a API está online
    @app.route("/")
    def index():
        from flask import jsonify

        return jsonify(
            {
                "status": "online",
                "message": "API Training Python Flask - Pronto para conexões",
                "version": "1.1.0 (Modular)",
            }
        )

    return app
