from flask import Blueprint, jsonify, request
from app.modules.agendamento.model import Agendamento
from app.modules.cliente.model import Cliente
from app.modules.barbeiro.model import Barbeiro
from app.modules.servico.model import Servico
from datetime import datetime, timedelta
from app.modules.agendamento.schema import (
    AgendamentoCreate,
    AgendamentoUpdateSchema,
    AgendamentoUpdateStatusSchema,
    AgendamentoResponse,
)
from app.utils.http.pagination import formatar_retorno_paginacao

from app.modules.agendamento.service import (
    AgendamentoService,
    ConflitoHorarioError,
    AcessoNegadoError,
    AgendamentoNaoEncontradoError,
)
from app.utils.http.error_formatter import formatar_erros_pydantic
from pydantic import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.utils.security.decorators import admin_required, role_required
from app.utils.email.email_layouts import obter_layout_agendamento
from app.extensions import app_logger, db
from app.modules.auth.email_service import EmailService

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
        # Como não temos service de clientes, serviços e barbeiros, vamos pegar na rota por enquanto
        cliente = Cliente.query.get(agendamento_novo.cliente_id)
        servico = Servico.query.get(agendamento_novo.servico_id)
        barbeiro = Barbeiro.query.get(agendamento_novo.barbeiro_id)

        # Vinicius - 14/04/2026
        # Variavel sucesso e mensagem criados para enviar o email e capturar a resposta da função do serviço
        sucesso = EmailService.enviar_notificacao_simples(
            destinatario=cliente.email,
            assunto="Agendamento criado com sucesso",
            mensagem_texto=obter_layout_agendamento(
                nome_usuario=cliente.nome.title(),
                data=agendamento_novo.data_agendamento.strftime("%d/%m/%Y"),
                hora=agendamento_novo.data_agendamento.strftime("%H:%M"),
                servico=servico.nome.title(),
                barbeiro=barbeiro.nome.title(),
            ),
        )

        # Vinicius - 14/04/2026
        # Caso não tenho sucesso, cria um logger de erro e retorna a mensagem de erro, caso tudo dê certo, retorna mensagem positiva
        if False in sucesso:
            data_response = {
                **agendamento_novo.__dict__,
                "msg": "Agendamento criado, mas falhou ao enviar o email",
                "status_email": "alerta",
            }
            """
            IMPLEMENTAR UNDO NO BANCO DE DADOS CASO FALHE ALGUMA COISA, DADOS ESTÃO SENDO INSERIDOS MESMO COM MENSAGENS DE ERRO
            
            """
        else:
            data_response = {
                **agendamento_novo.__dict__,
                "msg": "Agendamento criado e e-mail enviado",
                "status_email": "sucesso",
            }

        response = AgendamentoResponse.model_validate(data_response)
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a criação de agendamentos
        app_logger.info(
            "Agendamento criado com sucesso",
            extra={
                "agendamento_id": agendamento_novo.id,
                "status": agendamento_novo.status,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return (
            jsonify(
                {
                    "sucesso": True,
                    "mensagem": data_response.get("msg"),
                    "dados": {"agendamento": response.model_dump()},
                }
            ),
            201,
        )
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
        agendamentos_dicts = [
            AgendamentoResponse.model_validate(agendamento).model_dump()
            for agendamento in agendamentos.items
        ]

        return (
            jsonify(
                {
                    "sucesso": True,
                    "dados": formatar_retorno_paginacao(
                        agendamentos_dicts,
                        agendamentos.total,
                        agendamentos.page,
                        agendamentos.per_page,
                    ),
                }
            ),
            200,
        )

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

        # Vinicius - 15/04/2026
        # Como não temos service de clientes, serviços e barbeiros, vamos pegar na rota por enquanto
        cliente = Cliente.query.get(agendamento_atualizado.cliente_id)
        servico = Servico.query.get(agendamento_atualizado.servico_id)
        barbeiro = Barbeiro.query.get(agendamento_atualizado.barbeiro_id)

        # Vinicius - 14/04/2026
        # Variavel sucesso e mensagem criados para enviar o email e capturar a resposta da função do serviço
        sucesso = EmailService.enviar_notificacao_simples(
            destinatario=cliente.email,
            assunto="Agendamento atualizado com sucesso",
            mensagem_texto=f"""Olá, {cliente.nome.title()}! Seu agendamento foi atualizado com sucesso.
            Data: {agendamento_atualizado.data_agendamento.strftime('%d/%m/%Y')}
            Horário: {agendamento_atualizado.data_agendamento.strftime('%H:%M')}
            Serviço: {servico.nome.title()}
            Barbeiro: {barbeiro.nome.title()}
            """,
        )

        if False in sucesso:
            data_response = {
                **agendamento_atualizado.__dict__,
                "msg": "Agendamento atualizado, mas e-mail não enviado",
                "status_email": "alerta",
            }
        else:
            data_response = {
                **agendamento_atualizado.__dict__,
                "msg": "Agendamento atualizado e e-mail enviado",
                "status_email": "sucesso",
            }
        response = AgendamentoResponse.model_validate(data_response)
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a edição de agendamentos
        app_logger.info(
            "Agendamento atualizado com sucesso",
            extra={
                "agendamento_id": agendamento_atualizado.id,
                "status": agendamento_atualizado.status,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
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

        # Ian - 21/04/2026 - Gatilho financeiro
        if agendamento_atualizado.status == Agendamento.STATUS_CONCLUIDO and not agendamento_atualizado.pago:
            from app.modules.transacoes.service import TransacaoFinanceiraService
            TransacaoFinanceiraService.registrar_pagamento(
                agendamento_id=id,
                forma_pagamento="dinheiro", # Default provisório
                comissao_pct=50.0
            )

        response = AgendamentoResponse.model_validate(agendamento_atualizado)
        db.session.commit()
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a atualização de status de agendamentos
        app_logger.info(
            "Agendamento atualizado com sucesso",
            extra={
                "agendamento_id": agendamento_atualizado.id,
                "status": agendamento_atualizado.status,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )

        return (
            jsonify(
                {
                    "sucesso": True,
                    "mensagem": "Status atualizado com sucesso",
                    "dados": {"agendamento": response.model_dump()},
                }
            ),
            200,
        )

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
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar a deleção de agendamentos
        app_logger.info(
            "Agendamento deletado com sucesso",
            extra={
                "agendamento_id": agendamento.id,
                "realizado_por": current_user_id,
                "role": role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return (
            jsonify({"sucesso": True, "mensagem": "Agendamento deletado com sucesso"}),
            200,
        )

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

        return (
            jsonify({"sucesso": True, "dados": {"agendamento": response.model_dump()}}),
            200,
        )
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
