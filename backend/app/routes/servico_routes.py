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
    #Vinicius - Paginação de serviços 31/03/2026
    #Paginação de serviços para evitar sobrecarga do sistema com buscas execivas no banco de dados
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)
    
    try:
        # TODO: Buscar todos os serviços
        #Vinicius - Paginação de serviços 31/03/2026
        servicos = Servico.query.paginate(page=page, per_page=per_page, error_out=False)
        
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


@servico_bp.route('/criar-servico', methods=['POST'])
def criar_servico():
    dados = request.get_json()
    #Vinicius - 01/04/2026
    #Adicinado barbeiro_id como campo obrigatório, para acompanhar o model Servico
    try:
        dados_servico = {
            'nome': dados.get('nome').lower(),
            'preco': dados.get('preco'),
            'duracao_minutos': dados.get('duracao_minutos'),
            'barbeiro_id': dados.get('barbeiro_id')
        }
        # Validando dados obrigatórios
        if (dados['nome'] is None or 
            dados['preco'] is None or 
            dados['duracao_minutos'] is None or
            dados['barbeiro_id'] is None):
            return jsonify({'erro': 'Campos nome, preco, duracao_minutos e barbeiro_id são obrigatórios'}), 400
        
        #Vinicius - 31/03/2026
        #Verificar se o serviço já existe para evitar criação de serviços repetidos
        if Servico.query.filter_by(nome=dados_servico.get('nome').lower()).first():
            return jsonify({'erro': 'Serviço já cadastrado'}), 409
        
        # Criar serviço e salvar no banco
        servico = Servico(**dados_servico)
        db.session.add(servico)
        db.session.commit()
        return jsonify({'servico': {
            'id': servico.id,
            'nome': servico.nome,
            'preco': servico.preco,
            'duracao_minutos': servico.duracao_minutos,
            'msg': 'Serviço criado com sucesso'
        }}), 201
    except Exception as e:
        return jsonify({'erro': 'Erro ao criar serviço: ' + str(e)}), 500

@servico_bp.route('/editar-servico/<int:id>', methods=['PUT'])
def editar_servico(id):
    try:
        servico = Servico.query.get(id)
        if not servico:
            return jsonify({'erro': 'Serviço não encontrado'}), 404

        dados_edicao = request.get_json()
        if 'nome' in dados_edicao:
            servico.nome = dados_edicao['nome']
        if 'preco' in dados_edicao:
            servico.preco = dados_edicao['preco']
        if 'duracao_minutos' in dados_edicao:
            servico.duracao_minutos = dados_edicao['duracao_minutos']
        
        db.session.commit()
        return jsonify({'servico': {
            'id': servico.id,
            'nome': servico.nome,
            'preco': servico.preco,
            'duracao_minutos': servico.duracao_minutos,
            'msg': 'Serviço editado com sucesso'
        }}), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao editar serviço: ' + str(e)}), 500

@servico_bp.route('/deletar-servico/<int:id>', methods=['DELETE'])
def deletar_servico(id):
    try:
        servico = Servico.query.get(id)
        if not servico:
            return jsonify({'erro': 'Serviço não encontrado'}), 404
        
        db.session.delete(servico)
        db.session.commit()
        return jsonify({'msg': 'Serviço deletado com sucesso'}), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao deletar serviço: ' + str(e)}), 500
    
@servico_bp.route('/buscar-servico/<int:id>', methods=['GET'])
def buscar_servico(id):
    try:
        servico = Servico.query.get(id)
        if not servico:
            return jsonify({'erro': 'Serviço não encontrado'}), 404
        
        servico_dict = {
            'id': servico.id,
            'nome': servico.nome,
            'preco': servico.preco,
            'duracao_minutos': servico.duracao_minutos
        }
        return jsonify({'servico': servico_dict}), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao buscar serviço: ' + str(e)}), 500