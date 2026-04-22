# Ian - 22/04/2026
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.modules.transacoes.service import TransacaoFinanceiraService
from app.utils.security.decorators import role_required
from app.extensions import app_logger
from datetime import timedelta, datetime

transacoes_bp = Blueprint("transacoes", __name__, url_prefix="/api/financeiro/transacoes")

@transacoes_bp.route("", methods=["POST"])
@jwt_required()
@role_required("admin")
def registrar_pagamento():
    """
    Registra um pagamento para um agendamento concluído.
    Endpoint restrito apenas a administradores.
    """
    try:
        data = request.get_json()

        agendamento_id = data.get("agendamento_id")
        forma_pagamento = data.get("forma_pagamento", "dinheiro")
        comissao_pct = data.get("comissao_pct", 50.0)
        observacoes = data.get("observacoes")

        if not agendamento_id:
            return jsonify({"erro": "agendamento_id é obrigatório"}), 400

        # Validar forma de pagamento
        formas_validas = ["dinheiro", "pix", "credito", "debito"]
        if forma_pagamento not in formas_validas:
            return (
                jsonify(
                    {
                        "erro": f"forma_pagamento deve ser uma de: {', '.join(formas_validas)}"
                    }
                ),
                400,
            )

        resultado = TransacaoFinanceiraService.registrar_pagamento(
            agendamento_id=agendamento_id,
            forma_pagamento=forma_pagamento,
            comissao_pct=comissao_pct,
            observacoes=observacoes,
        )

        if not resultado.get("sucesso"):
            return jsonify(resultado), 400

        return jsonify(resultado), 201

    except Exception as e:
        app_logger.error(
            "Erro ao registrar pagamento",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": f"Erro ao registrar pagamento: {str(e)}"}), 500


@transacoes_bp.route("/<int:transacao_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def reverter_pagamento(transacao_id):
    """
    Reverte uma transação de pagamento.
    Endpoint restrito apenas a administradores.
    """
    try:
        data = request.get_json() or {}
        motivo = data.get("motivo")

        resultado = TransacaoFinanceiraService.reverter_pagamento(
            transacao_id=transacao_id, motivo=motivo
        )

        if not resultado.get("sucesso"):
            return jsonify(resultado), 400

        return jsonify(resultado), 200

    except Exception as e:
        app_logger.error(
            f"Erro ao reverter pagamento {transacao_id}",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": f"Erro ao reverter pagamento: {str(e)}"}), 500


@transacoes_bp.route("/barbeiro/<int:barbeiro_id>/comissoes", methods=["GET"])
@jwt_required()
@role_required("admin")
def obter_comissoes_barbeiro(barbeiro_id):
    """
    Retorna o total de comissões de um barbeiro em um período.
    Endpoint restrito apenas a administradores.

    Query params:
    - dias: Quantidade de dias retroativos (padrão: 30)
    - mes: Mês específico (1-12) - se informado, ignora 'dias'
    - ano: Ano específico - deve ser informado junto com 'mes'
    """
    try:
        dias = request.args.get("dias", 30, type=int)
        mes = request.args.get("mes", type=int)
        ano = request.args.get("ano", type=int)

        # Se mes e ano foram informados, usar esse período
        if mes and ano:
            if not (1 <= mes <= 12):
                return jsonify({"erro": "Mês inválido (deve ser 1-12)"}), 400

            import calendar

            data_inicio = datetime(ano, mes, 1)
            last_day = calendar.monthrange(ano, mes)[1]
            data_fim = datetime(ano, mes, last_day, 23, 59, 59)
        else:
            # Caso contrário, usar 'dias'
            data_fim = datetime.utcnow()
            data_inicio = data_fim - timedelta(days=dias)

        resultado = TransacaoFinanceiraService.calcular_comissoes_barbeiro(
            barbeiro_id=barbeiro_id, data_inicio=data_inicio, data_fim=data_fim
        )

        return (
            jsonify(
                {
                    "sucesso": True,
                    "mensagem": "Comissões obtidas com sucesso",
                    "dados": resultado,
                }
            ),
            200,
        )

    except Exception as e:
        app_logger.error(
            f"Erro ao obter comissões do barbeiro {barbeiro_id}",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return jsonify({"erro": f"Erro ao obter comissões: {str(e)}"}), 500
