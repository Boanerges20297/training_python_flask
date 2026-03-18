from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Inicializa o banco de dados (vai ser usado pelos modelos)
# Criamos aqui, fora de qualquer função, para importar nos modelos
db = SQLAlchemy()

def create_app():
    """
    FACTORY PATTERN - Cria e configura a aplicação Flask
    
    Esta função:
    1. Cria a instância Flask
    2. Carrega as configurações
    3. Inicializa o banco de dados
    4. Registra os blueprints (rotas)
    """
    
    # 1. Criar a app Flask
    app = Flask(__name__)
    
    # 2. Carregar configurações do config.py
    from config import Config
    app.config.from_object(Config)
    
    # 3. Inicializar banco de dados com a app
    db.init_app(app)
    
    # 4. Registrar blueprints (rotas)
    # Vamos adicionar aqui quando criarmos os blueprints
    # by exemplo: app.register_blueprint(cliente_bp)
    
    # 5. Criar as tabelas no banco (quando a app inicia)
    with app.app_context():
        db.create_all()
    
    return app
