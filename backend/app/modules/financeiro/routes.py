# Vinicius 20/04/2026
# Módulo financeiro estrito: Rota de Relatórios Escaláveis (Paginadas)
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.modules.financeiro.service import FinanceiroService
from app.utils.security.decorators import role_required
from app.extensions import app_logger
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.utils.http.pagination import formatar_retorno_paginacao

financeiro_bp = Blueprint("financeiro", __name__, url_prefix="/api/financeiro")


@financeiro_bp.route("/relatorio", methods=["GET"])
@jwt_required()
@role_required("admin")
def gerar_nota_fiscal_e_extrato():
    try:
        # Tenta extrair valores básicos
        mes = request.args.get("mes", type=int)
        ano = request.args.get("ano", type=int)

        # Vinicius 20/04/2026 - Adiciona log de auditoria
        usuario = get_jwt_identity()
        role = get_jwt().get("role")

        # Paginação opcional: Assume página 1 iterando de 50 em 50 caso falte input.
        pagina = request.args.get("pagina", default=1, type=int)
        limite = request.args.get("limite", default=50, type=int)

        if not mes or not ano:
            return (
                jsonify(
                    {
                        "erro": "Para acessar as notas, os parâmetros 'mes' e 'ano' são obrigatórios na URL."
                    }
                ),
                400,
            )

        if not (1 <= mes <= 12):
            return jsonify({"erro": "Mês logicamente inválido."}), 400

        dados = FinanceiroService.obter_relatorio(mes, ano, pagina, limite)

        # Gera o Log Auditoria Transparente de acesso
        app_logger.info(
            "Admin acessou o Módulo Financeiro",
            extra={
                "current_user": usuario,
                "role": role,
                "mes": mes,
                "ano": ano,
                "pagina": pagina,
            },
        )

        paginacao = formatar_retorno_paginacao(
            dados["items"],
            dados["total"],
            dados["pagina"],
            dados["per_page"],
            label_items="items",
        )
        paginacao["resumo"] = dados["resumo"]
        paginacao["lucro_por_barbeiro"] = dados["lucro_por_barbeiro"]

        return jsonify({"sucesso": True, "dados": paginacao}), 200

    except Exception as e:
        app_logger.error(
            f"Erro crasso ao gerar relatorio financeiro escalavel: {str(e)}",
            exc_info=True,
        )
        return (
            jsonify(
                {
                    "erro": "Ocorreu um problema de infraestrutura ao processar os componentes do extrato financeiro."
                }
            ),
            500,
        )
