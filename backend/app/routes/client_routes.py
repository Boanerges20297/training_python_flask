from flask import Blueprint, jsonify, request
from app.models.cliente import Cliente
from app import db
from app.utils.decorators import admin_required 

clientes_bp = Blueprint('clientes',__name__,url_prefix='/api/clientes')

@clientes_bp.route('/', methods=['GET'])
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

@clientes_bp.route('/criar-cliente', methods=['POST'])
def criar_cliente():
    dados = request.get_json()
    try:
        dados_cliente = {
            'nome': dados.get('nome'),
            'telefone': dados.get('telefone'),
            'email': dados.get('email'),
            'senha': dados.get('senha')
        }
        # Validando dados obrigatórios
        if dados['nome'] is None or dados['telefone'] is None or dados['email'] is None or dados['senha'] is None:
            return jsonify({'erro': 'Campos nome, telefone, email e senha são obrigatórios'}), 400
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
    
@clientes_bp.route('/editar-cliente/<int:id>', methods=['PUT'])
def editar_cliente(id):
    try:
        cliente = Cliente.query.get(id)
        if not cliente:
            return jsonify({'erro': 'Cliente não encontrado'}), 404

        dados_edicao = request.get_json()
        if not dados_edicao:
            return jsonify({'erro': 'Nenhum dado fornecido para atualização'}), 400
        
        if dados_edicao.get('email') and '@' not in dados_edicao['email']:
            return jsonify({'erro': 'Email inválido'}), 400
        
        # Verificar se os dados antigos são iguais aos novos (para evitar atualização desnecessária)
        if (cliente.nome == dados_edicao.get('nome', cliente.nome) and
            cliente.telefone == dados_edicao.get('telefone', cliente.telefone) and
            cliente.email == dados_edicao.get('email', cliente.email)):
            return jsonify({'msg': 'Nenhuma alteração detectada'}), 200

        # Atualizar os campos do cliente
        cliente.nome = dados_edicao.get('nome', cliente.nome)
        cliente.telefone = dados_edicao.get('telefone', cliente.telefone)
        cliente.email = dados_edicao.get('email', cliente.email)

        db.session.commit()
        return jsonify({'cliente': {
            'id': cliente.id,
            'nome': cliente.nome,
            'telefone': cliente.telefone,
            'email': cliente.email,
            'msg': 'Cliente atualizado com sucesso'
        }}), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao atualizar cliente: ' + str(e)}), 500

@clientes_bp.route('/deletar-cliente/<int:id>', methods=['DELETE'])
@admin_required
def deletar_cliente(id):
    try:
        cliente = Cliente.query.get(id)
        if not cliente:
            return jsonify({'erro': 'Cliente não encontrado'}), 404
        
        db.session.delete(cliente)
        db.session.commit()
        return jsonify({'msg': 'Cliente deletado com sucesso'}), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao deletar cliente: ' + str(e)}), 500
    
@clientes_bp.route('/buscar-cliente/<int:id>', methods=['GET'])
def buscar_cliente(id):
    try:
        cliente = Cliente.query.get(id)
        if not cliente:
            return jsonify({'erro': 'Cliente não encontrado'}), 404
        
        cliente_dict = {
            'id': cliente.id,
            'nome': cliente.nome,
            'telefone': cliente.telefone,
            'email': cliente.email
        }
        return jsonify({'cliente': cliente_dict}), 200
    except Exception as e:
        return jsonify({'erro': 'Erro ao buscar cliente: ' + str(e)}), 500  