from flask import Flask, jsonify
from config import DevelopmentConfig, ProductionConfig
from app.extensions import db, limiter, jwt, cors
from app.jwt_callbacks import register_jwt_handlers
import os


def create_app():
    """
    FACTORY PATTERN - Cria e configura a aplicação Flask
    """

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
    app.config.from_object(DevelopmentConfig)

    # Vinicius - 02/04/2026
    # Inicializa o rate limiter
    if app.config["RATELIMIT_ENABLED"]:
        limiter.init_app(app)

    jwt.init_app(app)
    cors.init_app(app)
    db.init_app(app)

    register_jwt_handlers(jwt)

    # Inicializa o Logger (Logging Estruturado)
    # Tem que ser importado aqui por causa do cache db/jwt 
    from app.extensions import app_logger
    from app.utils.logger_setup import setup_logger
    setup_logger(app, app_logger)

    # 4. Registrar blueprints (Rotas Modulares)
    from app.routes.client_routes import clientes_bp
    from app.routes.servico_routes import servico_bp
    from app.routes.agendamento_routes import agendamento_bp
    from app.routes.auth_routes import auth_bp
    from app.routes.tests_routes import tests_bp
    from app.routes.barbeiro_routes import barbeiros_bp
    from app.routes.admin_routes import admin_bp

    app.register_blueprint(clientes_bp)
    app.register_blueprint(servico_bp)
    app.register_blueprint(agendamento_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(barbeiros_bp)
    app.register_blueprint(admin_bp)
    # Vinicius - 02/04/2026
    # Se tiver em ambiente de desenvolvimento, importe tests_bp
    if app.config["DEBUG"] == True:
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
