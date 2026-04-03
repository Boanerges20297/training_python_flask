from flask import Blueprint, jsonify, request
from app.models.agendamento import Agendamento
from app.models.servico import Servico
from app import db
from datetime import datetime, timedelta
from app.schemas.agendamento_schema import AgendamentoSchema

agendamento_bp = Blueprint('agendamento',__name__,url_prefix='/api/agendamento')

@agendamento_bp.route('/criar-agendamento', methods=['POST'])
def criar_agendamento():
    dados = request.get_json()
    
    try:
        data = AgendamentoSchema(**dados) 
        #Se existir um agendamento entre a data de inicio e fim do serviço, retornar erro
        duracao_servico = Servico.query.get(data.servico_id).duracao_minutos
        data_fim = data.data_agendamento + timedelta(minutes=duracao_servico)
        if Agendamento.query.filter(
            Agendamento.barbeiro_id == data.barbeiro_id,
            Agendamento.data_agendamento >= data.data_agendamento,
            Agendamento.data_agendamento < data_fim
        ).first():
            return jsonify({'erro': 'Horario indisponivel'}), 409

        #Criar agendamento e salvar no banco
        agendamento = Agendamento(**data.model_dump())
        db.session.add(agendamento)
        db.session.commit()
        return jsonify({'agendamento': {
            'id': agendamento.id,
            'cliente_id': agendamento.cliente_id,
            'barbeiro_id': agendamento.barbeiro_id,
            'servico_id': agendamento.servico_id,
            'data_agendamento': agendamento.data_agendamento,
            'observacoes': agendamento.observacoes,
            'msg': 'Agendamento criado com sucesso'
        }}), 201

    except ValueError as e:
        return jsonify({'erro': 'Erro ao criar agendamento: ' + str(e)}), 400
    except Exception as e:
        return jsonify({'erro': 'Erro ao criar agendamento: ' + str(e)}), 500
    
@agendamento_bp.route('/listar-agendamento', methods=['GET'])
def listar_agendamento():
    #Vinicius - Paginação de Agendamentos 31/03/2026
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)
    try:
        #Vinicius - Paginação de Agendamentos 31/03/2026
        agendamento = Agendamento.query.paginate(page=page, per_page=per_page, error_out=False)
        agendamento_dict = [
            {
                'id': a.id,
                'cliente_id': a.cliente_id,
                'barbeiro_id': a.barbeiro_id,
                'servico_id': a.servico_id,
                'data_agendamento': a.data_agendamento,
                'observacoes': a.observacoes
            }
            for a in agendamento
        ]
        # Retornar em JSON com chave 'agendamentos'
        return jsonify({'agendamentos': agendamento_dict})
    except Exception as e:
        return jsonify({'erro': 'Não foi possível listar os agendamentos: ' + str(e)}), 500
    
@agendamento_bp.route('/editar-agendamento/<int:id>', methods=['PUT'])
def editar_agendamento(id):
    try:
        agendamento = Agendamento.query.get(id)
        if not agendamento:
            return jsonify({'erro': 'Agendamento não encontrado'}), 404
        
        # Verificar quais campos foram enviados e atualizar somente esses
        dados = request.get_json()
        if 'cliente_id' in dados:
            agendamento.cliente_id = dados['cliente_id']
        if 'barbeiro_id' in dados:
            agendamento.barbeiro_id = dados['barbeiro_id']
        if 'servico_id' in dados:
            agendamento.servico_id = dados['servico_id']
        if 'data_agendamento' in dados:
            agendamento.data_agendamento = dados['data_agendamento']
        if 'observacoes' in dados:
            agendamento.observacoes = dados['observacoes']

        db.session.commit()
        
        return jsonify({'agendamento': {
            'id': agendamento.id,
            'cliente_id': agendamento.cliente_id,
            'barbeiro_id': agendamento.barbeiro_id,
            'servico_id': agendamento.servico_id,
            'data_agendamento': agendamento.data_agendamento,
            'observacoes': agendamento.observacoes,
            'msg': 'Agendamento atualizado com sucesso'
        }})
    except Exception as e:
        return jsonify({'erro': 'Erro ao editar agendamento: ' + str(e)}), 500

@agendamento_bp.route('/deletar-agendamento/<int:id>', methods=['DELETE'])
def deletar_agendamento(id):
    try:
        agendamento = Agendamento.query.get(id)
        if not agendamento:
            return jsonify({'erro': 'Agendamento não encontrado'}), 404
        
        db.session.delete(agendamento)
        db.session.commit()
        
        return jsonify({'msg': 'Agendamento deletado com sucesso'})
    except Exception as e:
        return jsonify({'erro': 'Erro ao deletar agendamento: ' + str(e)}), 500
    
@agendamento_bp.route('/buscar-agendamento/<int:id>', methods=['GET'])
def buscar_agendamento(id):
    try:
        agendamento = Agendamento.query.get(id)
        if not agendamento:
            return jsonify({'erro': 'Agendamento não encontrado'}), 404
        
        agendamento_dict = {
            'id': agendamento.id,
            'cliente_id': agendamento.cliente_id,
            'barbeiro_id': agendamento.barbeiro_id,
            'servico_id': agendamento.servico_id,
            'data_agendamento': agendamento.data_agendamento,
            'observacoes': agendamento.observacoes
        }
        
        return jsonify({'agendamento': agendamento_dict})
    except Exception as e:
        return jsonify({'erro': 'Erro ao buscar agendamento: ' + str(e)}), 500