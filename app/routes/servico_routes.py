"""
DESAFIO 1: Criar API GET para listar serviços

O que você precisa fazer neste arquivo:
1. Importar Blueprint e jsonify do Flask
2. Importar o modelo Servico
3. Criar um blueprint com url_prefix='/api/servicos'
4. Criar rota GET que lista todos os serviços
5. Retornar em JSON

Não comece a codar ainda! Primeiro leia os comentários abaixo.
"""

# ========== PASSO 1: IMPORTAÇÕES ==========
# Você precisa importar:
# - Blueprint: para organizar rotas
# - jsonify: para retornar JSON automaticamente
# - db: para mexer com banco (se precisar)
# - Servico: o modelo que você criou em models/servico.py

# Escreva aqui as 4 importações necessárias:
# TODO: from flask import ...
# TODO: from app import ...
# TODO: from app.models import ...
from flask import Blueprint, jsonify, request
from app.models.servico import Servico
from app.models.cliente import Cliente
from app import db

# ========== PASSO 2: CRIAR BLUEPRINT ==========
# Um blueprint precisa de um nome e um prefixo de URL
# Nome: 'servicos' (pode ser qualquer coisa)
# URL Prefix: '/api/servicos' (todas as rotas deste blueprint começam com isso)

# TODO: servico_bp = Blueprint(...)
servico_bp = Blueprint('servicos',__name__,url_prefix='/api/servicos')
clientes_bp = Blueprint('clientes',__name__,url_prefix='/api/clientes')

# ========== PASSO 3: CRIAR ROTA GET ==========
# Rota: /api/servicos  (GET)
# Método: GET
# O que faz: Retorna lista de todos os serviços

# DICA: Use este decorador
# @servico_bp.route('', methods=['GET'])
# (vazio '' porque já tem '/api/servicos' no url_prefix)

@servico_bp.route('/', methods=['GET'])
def listar_servicos():
    """
    Endpoint para listar todos os serviços
    
    Passos para implementar:
    1. Buscar todos os serviços do banco com Servico.query.all()
    2. Converter cada serviço em dicionário (para JSON)
    3. Retornar com jsonify() 
    """
    
    try:
        # TODO: Buscar todos os serviços
        servicos = Servico.query.all()
        
        # TODO: Converter para lista de dicionários
        # Utilizando 'dict comphreension'
        servicos_dict = [
            {
                'id': s.id,
                'nome': s.nome,
                'preco': s.preco,
                'duracao_minutos': s.duracao_minutos
            }
            for s in servicos
        ]
        
        # TODO: Retornar em JSON
        return jsonify({'servicos': servicos_dict})
        
        pass
    
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

@clientes_bp.route('/listar_clientes', methods=['GET'])
def listar_clientes():
    try:
        clientes = Cliente.query.all()
        clientes_dict = [
            {
                'id': c.id,
                'nome': c.nome,
                'telefone': c.telefone,
                'email': c.email
            }
            for c in clientes
        ]
        # Retornar em JSON com chave 'clientes'
        return jsonify({'clientes': clientes_dict})
    except Exception as e:
        return jsonify({'erro': 'Não foi possível listar os clientes: ' + str(e)}), 500

@clientes_bp.route('/', methods=['POST'])
def criar_cliente():
    dados = request.get_json()
    try:
        dados_cliente = {
            'nome': dados.get('nome'),
            'telefone': dados.get('telefone'),
            'email': dados.get('email')
        }
        # Validando dados obrigatórios
        if dados['nome'] is None or dados['telefone'] is None or dados['email'] is None:
            return jsonify({'erro': 'Campos nome, telefone e email são obrigatórios'}), 400
        # Validando formato do email e unicidade
        if Cliente.query.filter_by(email=dados['email']).first():
            return jsonify({'erro': 'Email já cadastrado'}), 400
        # Validando formato do email (simples)
        if dados['email'] and '@' not in dados['email']:
            return jsonify({'erro': 'Email inválido'}), 400
        
        # Criar cliente e salvar no banco
        cliente = Cliente(**dados_cliente)
        db.session.add(cliente)
        db.session.commit()
        return jsonify({'cliente': {
            'id': cliente.id,
            'nome': cliente.nome,
            'telefone': cliente.telefone,
            'email': cliente.email,
            'msg': 'Cliente criado com sucesso'
        }}), 201
    except Exception as e:
        return jsonify({'erro': 'Erro ao incluir cliente: ' + str(e)}), 500
    

# ========== PRÓXIMOS PASSOS ==========
# 1. Implemente a função acima
# 2. Salve este arquivo
# 3. Vá para run.py e registre este blueprint
# 4. Teste com GET http://localhost:5000/api/servicos
