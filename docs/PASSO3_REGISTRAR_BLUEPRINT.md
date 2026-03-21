"""
PASSO 3: REGISTRAR O BLUEPRINT EM run.py

Agora que você criou servico_routes.py com o blueprint,
precisa "conectar" ele em run.py

Como funciona:
1. Importar o blueprint de app/routes/servico_routes.py
2. Usar app.register_blueprint() para ativar as rotas
"""

# ========== INSTRUÇÕES ==========

# Você precisa fazer isso em run.py (que já está na sua pasta):

# 1. Adicionar esta importação no topo:
#    from app.routes.servico_routes import servico_bp

# 2. Depois de criar a app, registrar o blueprint:
#    app.register_blueprint(servico_bp)

# ========== ONDE COLOCAR NO run.py ==========

# Seu run.py deve ficar assim:

"""
from flask import render_template
from app import create_app

# Cria a aplicação
app = create_app()

# ========== IMPORTAR BLUEPRINTS ==========
from app.routes.servico_routes import servico_bp  # <- ADICIONE ISTO

# ========== REGISTRAR BLUEPRINTS ==========
app.register_blueprint(servico_bp)  # <- ADICIONE ISTO

# ========== ROTAS SIMPLES (Frontend) ==========
@app.route('/')
def index():
    return render_template('index.html')

# ... resto do código
"""

# ========== PRÓXIMOS PASSOS ==========

# 1. Implemente servico_routes.py (listar_servicos)
# 2. Edite run.py e adicione as 2 linhas acima
# 3. Teste a API
