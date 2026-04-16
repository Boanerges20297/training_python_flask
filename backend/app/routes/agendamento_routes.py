from flask import Blueprint, jsonify, request
from app.models.agendamento import Agendamento
from app.models.cliente import Cliente
from app.models.barbeiro import Barbeiro
from app import db
from datetime import datetime, timedelta
from app.schemas.agendamento_schema import (
    AgendamentoCreate,
    AgendamentoUpdateSchema,
    AgendamentoUpdateStatusSchema,
    AgendamentoListResponse,
    AgendamentoResponse,
)
from app.services.agendamento_service import (
    AgendamentoService,
    ConflitoHorarioError,
    AcessoNegadoError,
    AgendamentoNaoEncontradoError,
)
from app.utils.error_formatter import formatar_erros_pydantic
from pydantic import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.utils.decorators import admin_required, role_required
from app.extensions import app_logger, db
from app.services.email_service import EmailService

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
            app_logger.warning(
                "Falha de validação ao criar agendamento (Pydantic)",
                extra={"erros_validacao": erros},
            )
            return jsonify(erros), 400
        # Vinicius - 11/04/2026
        # Passado toda a logica do agendamento para o service (conflitos, validações, etc)
        agendamento_novo = AgendamentoService.criar_agendamento(
            data, role, current_user_id
        )

        # Vinicius - 15/04/2026
        # Como não temos service de clientes vamos pegar na rota por enquanto
        cliente = Cliente.query.get(agendamento_novo.cliente_id)
        # Como não temos service de clientes, vamos pegar na rota por enquanto
        # Vinicius - 15/04/2026

        # Vinicius - 14/04/2026
        # Variavel sucesso e mensagem criados para enviar o email e capturar a resposta da função do serviço
        sucesso = EmailService.enviar_notificacao_simples(
            destinatario=cliente.email,
            assunto="Agendamento criado com sucesso",
            mensagem_texto=f"Olá, {cliente.nome.title()}! Seu agendamento foi criado com sucesso.",
        )

        # Vinicius - 14/04/2026
        # Caso não tenho sucesso, cria um logger de erro e retorna a mensagem de erro, caso tudo dê certo, retorna mensagem positiva
        if False in sucesso:
            data_response = {
                **agendamento_novo.__dict__,
                "msg": "Agendamento criado, mas falhou ao enviar o email",
                "status": "alerta",
            }
            """
            IMPLEMENTAR UNDO NO BANCO DE DADOS CASO FALHE ALGUMA COISA, DADOS ESTÃO SENDO INSERIDOS MESMO COM MENSAGENS DE ERRO
            
            """
        else:
            data_response = {
                **agendamento_novo.__dict__,
                "msg": "Agendamento criado e e-mail enviado",
                "status": "sucesso",
            }

        response = AgendamentoResponse.model_validate(data_response)
        db.session.commit()

        return jsonify(response.model_dump()), 201
    except ConflitoHorarioError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 409
    except AcessoNegadoError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 403
    except ValueError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 400
    except Exception as e:
        db.session.rollback()
        app_logger.error(
            "Erro estrutural 500 ao criar agendamento",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao criar agendamento: " + str(e)}), 500


@agendamento_bp.route("", methods=["GET"])
@jwt_required()
def listar_agendamento():
    try:
        # Vinicius - 11/04/2026
        # Migrado toda a logica de negocios para dentro do services
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=10, type=int)

        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        agendamentos = AgendamentoService.listar_agendamentos(
            page, per_page, role, current_user_id
        )
        # Vinicius - 11/04/2026
        # Transformado o objeto agendamento em dicionário padronizado pelo schema
        response = AgendamentoListResponse.model_validate(
            {
                "page": agendamentos.page,
                "per_page": agendamentos.per_page,
                "has_next": agendamentos.has_next,
                "has_prev": agendamentos.has_prev,
                "data": [
                    AgendamentoResponse.model_validate(agendamento)
                    for agendamento in agendamentos.items
                ],
            }
        )

        return jsonify(response.model_dump()), 200

    except Exception as e:
        app_logger.error(
            "Erro estrutural 500 ao listar agendamentos",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
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
            erros = formatar_erros_pydantic(e)
            app_logger.warning(
                "Falha de validação Pydantic ao editar",
                extra={"erros_validacao": erros, "agendamento_id": id},
            )
            return jsonify(erros), 400

        # 2. Envia para o service para editar o agendamento
        agendamento_atualizado = AgendamentoService.editar_agendamento(
            id, dados, role, current_user_id
        )
        response = AgendamentoResponse.model_validate(agendamento_atualizado)
        db.session.commit()

        return jsonify(response.model_dump()), 200

    except ConflitoHorarioError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao editar agendamento: " + str(e)}), 409
    except AcessoNegadoError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao editar agendamento: " + str(e)}), 403
    except AgendamentoNaoEncontradoError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao editar agendamento: " + str(e)}), 404
    except ValueError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao editar agendamento: " + str(e)}), 400
    except Exception as e:
        db.session.rollback()
        app_logger.error(
            f"Erro estrutural 500 ao editar agendamento {id}",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
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
            erros = formatar_erros_pydantic(e)
            app_logger.warning(
                "Falha de validação Pydantic ao atualizar status",
                extra={"erros_validacao": erros, "agendamento_id": id},
            )
            return jsonify(erros), 400

        # 2. Envia para o service para editar o agendamento
        agendamento_atualizado = AgendamentoService.atualizar_status(
            id, dados, role, current_user_id
        )

        response = AgendamentoResponse.model_validate(agendamento_atualizado)
        db.session.commit()

        return jsonify(response.model_dump()), 200

    except AcessoNegadoError as e:
        db.session.rollback()
        return (
            jsonify({"erro": "Erro ao atualizar status do agendamento: " + str(e)}),
            403,
        )
    except ValueError as e:
        db.session.rollback()
        return jsonify(
            {"erro": "Erro ao atualizar status do agendamento: " + str(e)}
        ), (404 if "não encontrado" in str(e).lower() else 400)
    except Exception as e:
        db.session.rollback()
        app_logger.error(
            f"Erro estrutural 500 ao atualizar status {id}",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return (
            jsonify({"erro": "Erro ao atualizar status do agendamento: " + str(e)}),
            500,
        )


@agendamento_bp.route("/<int:id>", methods=["DELETE"])
@admin_required
def deletar_agendamento(id):
    try:
        current_user_id = int(get_jwt_identity())
        role = get_jwt().get("role")

        # Vinicius - 11/04/2026
        # Migrado toda a logica de negocios para dentro do services
        agendamento = AgendamentoService.deletar_registro_fisico(id)

        db.session.commit()
        return jsonify({"msg": "Agendamento deletado com sucesso"}), 200

    except AcessoNegadoError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao deletar agendamento: " + str(e)}), 403
    except ValueError as e:
        db.session.rollback()
        return jsonify({"erro": "Erro ao deletar agendamento: " + str(e)}), (
            404 if "não encontrado" in str(e).lower() else 400
        )
    except Exception as e:
        db.session.rollback()
        app_logger.error(
            f"Erro 500 crítico ao deletar agendamento {id}",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
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

        response = AgendamentoResponse.model_validate(agendamento)

        return jsonify(response.model_dump()), 200
    except AcessoNegadoError as e:
        return jsonify({"erro": "Erro ao buscar agendamento: " + str(e)}), 403
    except ValueError as e:
        return jsonify({"erro": "Erro ao buscar agendamento: " + str(e)}), (
            404 if "não encontrado" in str(e).lower() else 400
        )
    except Exception as e:
        app_logger.error(
            f"Erro 500 estrutural apontado ao buscar id {id}",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": "Erro ao buscar agendamento: " + str(e)}), 500
