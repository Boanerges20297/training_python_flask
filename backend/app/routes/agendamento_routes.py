from flask import Blueprint, jsonify, request
from app.models.agendamento import Agendamento
from app.models.servico import Servico
from app.models.cliente import Cliente
from app.models.barbeiro import Barbeiro
from app import db
from datetime import datetime, timedelta
from app.schemas.agendamento_schema import (
    AgendamentoCreate,
    AgendamentoUpdateSchema,
    AgendamentoListResponse,
    AgendamentoResponse,
)
from app.services.agendamento_service import (
    AgendamentoService,
    ConflitoHorarioError,
    AcessoNegadoError,
)
from app.utils.error_formatter import formatar_erros_pydantic
from pydantic import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

agendamento_bp = Blueprint("agendamento", __name__, url_prefix="/api/agendamento")


@agendamento_bp.route("", methods=["POST"])
@jwt_required()
def criar_agendamento():
    try:
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        try:
            data = AgendamentoCreate(**request.get_json())
        except ValidationError as e:
            erros = formatar_erros_pydantic(e)
            return jsonify(erros), 400
        # Vinicius - 11/04/2026
        # Passado toda a logica do agendamento para o service (conflitos, validações, etc)
        agendamento_novo = AgendamentoService.criar_agendamento(
            data, role, current_user_id
        )

        # Vinicius - 11/04/2026
        # Transformado o objeto agendamento em dicionário padronizado pelo schema
        response = AgendamentoResponse.model_dump(agendamento_novo)

        return jsonify(response), 201
    except ConflitoHorarioError as e:
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 409
    except AcessoNegadoError as e:
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 403
    except ValueError as e:
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 400
    except Exception as e:
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 500


@agendamento_bp.route("", methods=["GET"])
def listar_agendamento():
    try:
        # Vinicius - 11/04/2026
        # Migrado toda a logica de negocios para dentro do services
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=10, type=int)

        agendamentos = AgendamentoService.listar_agendamentos(page, per_page)
        # Vinicius - 11/04/2026
        # Transformado o objeto agendamento em dicionário padronizado pelo schema
        response = AgendamentoListResponse.model_dump(agendamentos)

        return jsonify(response), 200

    except Exception as e:
        return (
            jsonify({"erro": "Não foi possível listar os agendamentos: " + str(e)}),
            500,
        )


# Vinicius - 08/04/2026
# Mudança de metodo para PATCH, para ser mais semantico com a ação de editar
# Refatoração da rota editar_agendamento, para utilizar o schema AgendamentoSchema e atualizar dinamicamente os campos do agendamento
@agendamento_bp.route("/<int:id>", methods=["PATCH"])
@jwt_required()
def editar_agendamento(id):
    try:
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        # 1. Captura o JSON da requisição e Validação inicial: O Pydantic verifica tipos e campos extras
        try:
            dados = AgendamentoUpdateSchema(**request.get_json())
        except Exception as e:
            return {"error": "Dados inválidos", "detalhes": str(e)}, 400

        # 2. Envia para o service para editar o agendamento
        agendamento_atualizado = AgendamentoService.editar_agendamento(
            id, dados, role, current_user_id
        )

        response = AgendamentoResponse.model_dump(agendamento_atualizado)

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"erro": "Erro ao editar agendamento: " + str(e)}), 500


@agendamento_bp.route("/status/<int:id>", methods=["PATCH"])
@jwt_required()
def atualizar_status(id):
    try:
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        # 1. Captura o JSON da requisição e Validação inicial: O Pydantic verifica tipos e campos extras
        try:
            dados = AgendamentoUpdateStatusSchema(**request.get_json())
        except Exception as e:
            return {"error": "Dados inválidos", "detalhes": str(e)}, 400

        # 2. Envia para o service para editar o agendamento
        agendamento_atualizado = AgendamentoService.atualizar_status(
            id, dados, role, current_user_id
        )

        response = AgendamentoResponse.model_dump(agendamento_atualizado)

        return jsonify(response), 200

    except Exception as e:
        return (
            jsonify({"erro": "Erro ao atualizar status do agendamento: " + str(e)}),
            500,
        )


@agendamento_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def deletar_agendamento(id):
    try:
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        # Vinicius - 11/04/2026
        # Migrado toda a logica de negocios para dentro do services
        agendamento = AgendamentoService.deletar_registro_fisico(id)

        return jsonify({"msg": "Agendamento deletado com sucesso"}), 200

    except Exception as e:
        return jsonify({"erro": "Erro ao deletar agendamento: " + str(e)}), 500


@agendamento_bp.route("/buscar/<int:id>", methods=["GET"])
@jwt_required()
def buscar_agendamento(id):
    try:
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        # Vinicius - 11/04/2026
        # Migrado toda a logica de negocios para dentro do services
        agendamento = AgendamentoService.buscar_agendamento(id, role, current_user_id)

        response = AgendamentoResponse.model_dump(agendamento)

        return jsonify(response), 200
    except Exception as e:
        return jsonify({"erro": "Erro ao buscar agendamento: " + str(e)}), 500
