from flask import Blueprint, jsonify, request
from app.models.agendamento import Agendamento
from app.models.servico import Servico
from app.models.cliente import Cliente
from app.models.barbeiro import Barbeiro
from app import db
from datetime import datetime, timedelta
from app.schemas.agendamento_schema import AgendamentoSchema, AgendamentoUpdateSchema
from pydantic import ValidationError

agendamento_bp = Blueprint("agendamento", __name__, url_prefix="/api/agendamento")


@agendamento_bp.route("/criar-agendamento", methods=["POST"])
def criar_agendamento():
    try:
        # Vinicius - 05/04/2026
        # Adicionado validação de payload para garantir que os dados enviados estejam corretos
        data = AgendamentoSchema(**request.get_json())
        # Se existir um agendamento entre a data de inicio e fim do serviço, retornar erro
        # Vinicius - 05/04/2026
        # Adicionado verificação se o serviço existe
        if Servico.query.get(data.servico_id) is None:
            return jsonify({"erro": "Serviço não encontrado"}), 404
        # Vinicius - 05/04/2026
        # Adicionado verificação se o cliente existe
        if Cliente.query.get(data.cliente_id) is None:
            return jsonify({"erro": "Cliente não encontrado"}), 404
        # Vinicius - 05/04/2026
        # Adicionado verificação se o barbeiro existe
        if Barbeiro.query.get(data.barbeiro_id) is None:
            return jsonify({"erro": "Barbeiro não encontrado"}), 404

        duracao_servico = Servico.query.get(data.servico_id).duracao_minutos
        data_fim = data.data_agendamento + timedelta(minutes=duracao_servico)

        if Agendamento.query.filter(
            Agendamento.barbeiro_id == data.barbeiro_id,
            Agendamento.data_agendamento >= data.data_agendamento,
            Agendamento.data_agendamento < data_fim,
        ).first():
            return jsonify({"erro": "Horario indisponivel"}), 409

        # Criar agendamento e salvar no banco
        agendamento = Agendamento(**data.model_dump())
        db.session.add(agendamento)
        db.session.commit()
        return (
            jsonify(
                {
                    "agendamento": {
                        "id": agendamento.id,
                        "cliente_id": agendamento.cliente_id,
                        "barbeiro_id": agendamento.barbeiro_id,
                        "servico_id": agendamento.servico_id,
                        "data_agendamento": agendamento.data_agendamento,
                        "observacoes": agendamento.observacoes,
                        "msg": "Agendamento criado com sucesso",
                    }
                }
            ),
            201,
        )

    except ValueError as e:
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 400
    except Exception as e:
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 500


@agendamento_bp.route("/listar-agendamento", methods=["GET"])
def listar_agendamento():
    # Vinicius - Paginação de Agendamentos 31/03/2026
    # Adicionado paginação para evitar sobrecarga do sistema com buscas execivas no banco de dados
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)
    try:
        # Vinicius - Paginação de Agendamentos 31/03/2026
        # Vinicius - 04/04/2026
        # Troca do nome da variavel para 'agendamentos' para melhor identificação
        agendamentos = Agendamento.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        agendamento_dict = [
            {
                "id": a.id,
                "cliente_id": a.cliente_id,
                "barbeiro_id": a.barbeiro_id,
                "servico_id": a.servico_id,
                "data_agendamento": a.data_agendamento,
                "observacoes": a.observacoes,
            }
            # Vinicius - 04/04/2026
            # Adicionado o .items para que o list comprehension receba os itens da paginação
            for a in agendamentos.items
        ]
        # Retornar em JSON com chave 'agendamentos'
        # Vinicius - 04/04/2026
        # Adicionado formatação para melhor visualização dos dados de paginação e variaveis total e items_nessa_pagina para deixar a resposta mais completa
        return jsonify(
            {
                "agendamentos": agendamento_dict,
                "total": agendamentos.total,
                "items_nessa_pagina": len(agendamento_dict),
                "pagina": agendamentos.page,
                "per_page": agendamentos.per_page,
                "tem_proxima": agendamentos.has_next,
                "tem_pagina_anterior": agendamentos.has_prev,
            }
        )
    except Exception as e:
        return (
            jsonify({"erro": "Não foi possível listar os agendamentos: " + str(e)}),
            500,
        )


# Vinicius - 08/04/2026
# Mudança de metodo para PATCH, para ser mais semantico com a ação de editar
# Refatoração da rota editar_agendamento, para utilizar o schema AgendamentoSchema e atualizar dinamicamente os campos do agendamento
@agendamento_bp.route("/editar-agendamento/<int:id>", methods=["PATCH"])
def editar_agendamento(id):
    try:
        # 1. Captura o JSON da requisição
        body = request.get_json()

        # 2. Validação inicial: O Pydantic verifica tipos e campos extras
        try:
            # Pydantic valida o dicionário
            schema = AgendamentoUpdateSchema(**body)
        except Exception as e:
            return {"error": "Dados inválidos", "detalhes": str(e)}, 400

        # 3. Transforma em dicionário pegando APENAS o que foi enviado
        update_data = schema.model_dump(exclude_unset=True)

        # 4. Condição: Se o dicionário estiver vazio, não há o que atualizar
        if not update_data:
            return {"message": "Nenhuma alteração enviada."}, 400

        # 5. Busca o usuário no banco
        agendamento = Agendamento.query.get(id)
        if not agendamento:
            return {"error": "Agendamento não encontrado"}, 404

        # 6. Algoritmo de Atualização Dinâmica
        # Em vez de fazer: user.nome = update_data['nome'] manual para cada campo...
        # Verificações a mais para evitar atualizar dados para valores invalidos
        for key, value in update_data.items():
            match key:
                case "cliente_id":
                    if Cliente.query.get(value) is None:
                        return {"error": "Cliente não encontrado"}, 404
                case "barbeiro_id":
                    if Barbeiro.query.get(value) is None:
                        return {"error": "Barbeiro não encontrado"}, 404
                case "servico_id":
                    if Servico.query.get(value) is None:
                        return {"error": "Serviço não encontrado"}, 404
                case "data_agendamento":
                    if Agendamento.query.filter(
                        Agendamento.barbeiro_id == agendamento.barbeiro_id,
                        Agendamento.data_agendamento >= value,
                        Agendamento.data_agendamento
                        < value
                        + timedelta(
                            minutes=Servico.query.get(
                                agendamento.servico_id
                            ).duracao_minutos
                        ),
                    ).first():
                        return {"error": "Horario indisponivel"}, 409
            setattr(agendamento, key, value)  # Atualiza o atributo dinamicamente

        # 7. Persiste no banco
        db.session.commit()

        return {
            "message": "Agendamento atualizado com sucesso!",
            "campos_alterados": list(update_data.keys()),
        }, 200

    except Exception as e:
        return jsonify({"erro": "Erro ao editar agendamento: " + str(e)}), 500


@agendamento_bp.route("/deletar-agendamento/<int:id>", methods=["DELETE"])
def deletar_agendamento(id):
    try:
        agendamento = Agendamento.query.get(id)
        if not agendamento:
            return jsonify({"erro": "Agendamento não encontrado"}), 404

        db.session.delete(agendamento)
        db.session.commit()

        return jsonify({"msg": "Agendamento deletado com sucesso"})
    except Exception as e:
        return jsonify({"erro": "Erro ao deletar agendamento: " + str(e)}), 500


@agendamento_bp.route("/buscar-agendamento/<int:id>", methods=["GET"])
def buscar_agendamento(id):
    try:
        agendamento = Agendamento.query.get(id)
        if not agendamento:
            return jsonify({"erro": "Agendamento não encontrado"}), 404

        agendamento_dict = {
            "id": agendamento.id,
            "cliente_id": agendamento.cliente_id,
            "barbeiro_id": agendamento.barbeiro_id,
            "servico_id": agendamento.servico_id,
            "data_agendamento": agendamento.data_agendamento,
            "observacoes": agendamento.observacoes,
        }

        return jsonify({"agendamento": agendamento_dict})
    except Exception as e:
        return jsonify({"erro": "Erro ao buscar agendamento: " + str(e)}), 500


# Não foi adicionado a classe AgendamentoUpdateSchema pois os mesmos dados são enviados no schema AgendamentoSchema
