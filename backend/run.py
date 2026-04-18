import sys
import os
import subprocess

# Garante que o script use o ambiente virtual (venv) para evitar erros do Python 3.14 (Global)
def ensure_venv():
    if sys.prefix == sys.base_prefix:
        venv_python = os.path.abspath(os.path.join(os.path.dirname(__file__), 'venv', 'Scripts', 'python.exe'))
        if os.path.exists(venv_python):
            # Reinicia o script usando o Python do venv e repassa todos os argumentos
            # Usamos subprocess.call para garantir que o output apareça no terminal
            result = subprocess.call([venv_python, "run.py"])
            sys.exit(result)

ensure_venv()

from app import create_app

# Cria a aplicação usando o factory pattern
# O registro de Blueprints e a configuração do BD agora são feitos internamente no create_app
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
