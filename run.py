from flask import render_template
from app import create_app

# Cria a aplicação usando o factory pattern
app = create_app()

# ========== ROTAS SIMPLES (Frontend) ==========
# Estas são rotas que apenas retornam templates HTML
# Rotas mais complexas (API) ficarão em app/routes/

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/servicos')
def servicos():
    return render_template('servicos.html')

@app.route('/agendamento')
def agendamento():
    return render_template('agendamento.html')

@app.route('/contato')
def contato():
    return render_template('contato.html')

# ========== BLUEPRINTS (Rotas da API) ==========
# Quando criar os blueprints em app/routes/, registre aqui:
# from app.routes.cliente_routes import cliente_bp
# app.register_blueprint(cliente_bp)

if __name__ == '__main__':
    app.run(debug=True)
