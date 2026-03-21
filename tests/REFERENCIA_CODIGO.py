"""
REFERÊNCIA: Exemplos de Código para Consultar

Use este arquivo quando tiver dúvidas sobre sintaxe.
"""

# ========== EXEMPLO 1: Buscar dados do banco ==========

from app.models import Servico

# Buscar TODOS os serviços
todos_servicos = Servico.query.all()

# Buscar SERVIÇO POR ID
servico = Servico.query.get(1)

# Buscar COM FILTRO (ex: por nome)
servicos_corte = Servico.query.filter_by(nome='Corte').all()

# Contar quantos serviços existem
total = Servico.query.count()


# ========== EXEMPLO 2: Converter modelo para dicionário ==========

# Forma 1: Manualmente
servico_dict = {
    'id': servico.id,
    'nome': servico.nome,
    'preco': servico.preco
}

# Forma 2: Lista compreensão (mais elegante)
servicos_lista = [
    {
        'id': s.id,
        'nome': s.nome,
        'preco': s.preco
    }
    for s in todos_servicos
]


# ========== EXEMPLO 3: Retornar respostas JSON ==========

from flask import jsonify

# Retornar sucesso (200)
return jsonify({'servicos': servicos_lista}), 200

# Retornar erro (400 = erro do cliente)
return jsonify({'erro': 'Email inválido'}), 400

# Retornar erro de servidor (500)
return jsonify({'erro': 'Erro interno'}), 500

# Sem especificar status (padrão 200)
return jsonify({'servicos': servicos_lista})


# ========== EXEMPLO 4: Receber dados do frontend ==========

from flask import request

# No frontend, enviou:
# {
#   "nome": "João",
#   "email": "joao@example.com"
# }

dados = request.get_json()
nome = dados.get('nome')
email = dados.get('email')


# ========== EXEMPLO 5: Criar e salvar novo registro ==========

from app import db

# Criar novo objeto
novo_cliente = Cliente(
    nome='João',
    email='joao@example.com',
    telefone='11999999999'
)

# Salvar no banco
db.session.add(novo_cliente)
db.session.commit()

# Agora novo_cliente.id foi gerado automaticamente!
print(novo_cliente.id)


# ========== EXEMPLO 6: Blueprint simples ==========

from flask import Blueprint

# Criar blueprint
exemplo_bp = Blueprint('exemplo', __name__, url_prefix='/api/exemplo')

@exemplo_bp.route('/teste', methods=['GET'])
def teste():
    return jsonify({'mensagem': 'Funcionando!'})

# Em run.py:
# from app.routes.exemplo import exemplo_bp
# app.register_blueprint(exemplo_bp)

# Resultado:
# GET http://localhost:5000/api/exemplo/teste
# Retorna: {"mensagem": "Funcionando!"}


# ========== EXEMPLO 7: Tratamento de erros ==========

try:
    # Tentar fazer algo
    novo_usuario = Usuario(email=email)
    db.session.add(novo_usuario)
    db.session.commit()
    
except Exception as e:
    # Se der erro, faz isso
    return jsonify({'erro': str(e)}), 500

# ========== EXEMPLO 8: Validações simples ==========

# Email vazio?
if not email:
    return jsonify({'erro': 'Email é obrigatório'}), 400

# Telefone com menos de 10 dígitos?
if len(telefone) < 10:
    return jsonify({'erro': 'Telefone inválido'}), 400

# Email já existe?
existe = Usuario.query.filter_by(email=email).first()
if existe:
    return jsonify({'erro': 'Email já cadastrado'}), 400
