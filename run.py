from flask import render_template
from app import create_app
from app.routes.servico_routes import servico_bp,clientes_bp

# Cria a aplicação usando o factory pattern
app = create_app()

# ========== ROTAS SIMPLES (Frontend) ==========
# Estas são rotas que apenas retornam templates HTML
# Rotas mais complexas (API) ficarão em app/routes/

# ========== BLUEPRINTS (Rotas da API) ==========
# Quando criar os blueprints em app/routes/, registre aqui:
app.register_blueprint(servico_bp)
app.register_blueprint(clientes_bp)

if __name__ == '__main__':
    app.run(debug=True)
