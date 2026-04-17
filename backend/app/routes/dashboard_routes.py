from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

# Vinicius - 17/04/2026
# Comentado por enquanto para evitar erros
# from app.services.dashboard_service import DashboardService
from app.utils.decorators import admin_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

# Ian - 15/04/2026
# Retorna o dashboard geral da barbearia (métricas globais) acessível apenas por administradores


@dashboard_bp.route("/geral", methods=["GET"])
@admin_required
def get_dashboard_geral():
    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    dashboard = DashboardService.get_dashboard_geral(dias=dias)

    return (
        jsonify({"message": "Dashboard geral obtido com sucesso", "data": dashboard}),
        200,
    )


# Ian - 15/04/2026
# Retorna apenas a receita por período com base no dashboard geral (reaproveitando a lógica existente)
@dashboard_bp.route("/receita-periodo", methods=["GET"])
@admin_required
def get_receita_periodo():
    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    dashboard = DashboardService.get_dashboard_geral(dias=dias)

    receita_diaria = dashboard.get("receita_diaria", [])

    return (
        jsonify(
            {
                "message": "Receita por período obtida com sucesso",
                "data": receita_diaria,
            }
        ),
        200,
    )


# Ian - 15/04/2026
# Retorna o dashboard individual de um barbeiro, respeitando regras de acesso (admin ou próprio barbeiro)
@dashboard_bp.route("/barbeiro/<int:barbeiro_id>", methods=["GET"])
@jwt_required()
def get_dashboard_barbeiro(barbeiro_id):
    claims = get_jwt()
    role = claims.get("role")
    user_id = claims.get("sub")

    if role == "barbeiro" and int(user_id) != barbeiro_id:
        return jsonify({"message": "Acesso negado"}), 403

    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    dashboard = DashboardService.get_dashboard_barbeiro(barbeiro_id, dias=dias)

    if dashboard is None:
        return jsonify({"message": "Barbeiro não encontrado"}), 404

    return (
        jsonify(
            {"message": "Dashboard do barbeiro obtido com sucesso", "data": dashboard}
        ),
        200,
    )


# Ian - 15/04/2026
# Retorna apenas os serviços realizados por um barbeiro no período, com controle de acesso
@dashboard_bp.route("/servicos-barbeiro/<int:barbeiro_id>", methods=["GET"])
@jwt_required()
def get_servicos_barbeiro(barbeiro_id):
    claims = get_jwt()
    role = claims.get("role")
    user_id = claims.get("sub")

    if role == "barbeiro" and int(user_id) != barbeiro_id:
        return jsonify({"message": "Acesso negado"}), 403

    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    dashboard = DashboardService.get_dashboard_barbeiro(barbeiro_id, dias=dias)

    if dashboard is None:
        return jsonify({"message": "Barbeiro não encontrado"}), 404

    servicos_realizados = dashboard.get("servicos_realizados", [])

    return (
        jsonify(
            {
                "message": "Serviços realizados pelo barbeiro obtidos com sucesso",
                "data": servicos_realizados,
            }
        ),
        200,
    )


# Ian - 15/04/2026
# Retorna os horários mais populares da barbearia com base nos agendamentos concluídos (admin)
@dashboard_bp.route("/horarios-populares", methods=["GET"])
@admin_required
def get_horarios_populares():
    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    dashboard = DashboardService.get_dashboard_geral(dias=dias)

    top_5_horarios = dashboard.get("top_5_horarios", [])

    return (
        jsonify(
            {
                "message": "Horários populares obtidos com sucesso",
                "data": top_5_horarios,
            }
        ),
        200,
    )


# Ian - 16/04/2026
# Retorna ganhos totais da barbearia por período (mês, semana, dia) - admin
@dashboard_bp.route("/ganhos-totais", methods=["GET"])
@admin_required
def get_ganhos_totais():
    periodo = request.args.get("periodo", "mes")
    if periodo not in ["mes", "semana", "dia"]:
        return jsonify({"message": "Período deve ser 'mes', 'semana' ou 'dia'"}), 400

    ganhos = DashboardService.get_ganhos_totais(periodo=periodo)
    return (
        jsonify(
            {
                "message": f"Ganhos totais do {periodo} obtidos com sucesso",
                "data": ganhos,
            }
        ),
        200,
    )


# Ian - 16/04/2026
# Retorna ganhos de cada barbeiro por período (mês, semana, dia) - admin
@dashboard_bp.route("/ganhos-barbeiros", methods=["GET"])
@admin_required
def get_ganhos_barbeiros():
    periodo = request.args.get("periodo", "mes")
    if periodo not in ["mes", "semana", "dia"]:
        return jsonify({"message": "Período deve ser 'mes', 'semana' ou 'dia'"}), 400

    ganhos = DashboardService.get_ganhos_barbeiros(periodo=periodo)
    return (
        jsonify(
            {
                "message": f"Ganhos dos barbeiros do {periodo} obtidos com sucesso",
                "data": ganhos,
            }
        ),
        200,
    )


# Ian - 16/04/2026
# Retorna quantidade de atendimentos geral com filtro de data - admin
@dashboard_bp.route("/atendimentos-gerais", methods=["GET"])
@admin_required
def get_atendimentos_gerais():
    data_inicio = request.args.get("data_inicio")
    data_fim = request.args.get("data_fim")

    if not data_inicio or not data_fim:
        return (
            jsonify(
                {
                    "message": "data_inicio e data_fim são obrigatórios (formato YYYY-MM-DD)"
                }
            ),
            400,
        )

    try:
        from datetime import datetime

        datetime.strptime(data_inicio, "%Y-%m-%d")
        datetime.strptime(data_fim, "%Y-%m-%d")
    except ValueError:
        return jsonify({"message": "Datas devem estar no formato YYYY-MM-DD"}), 400

    atendimentos = DashboardService.get_atendimentos_gerais(data_inicio, data_fim)
    return (
        jsonify(
            {"message": "Atendimentos gerais obtidos com sucesso", "data": atendimentos}
        ),
        200,
    )


# Ian - 16/04/2026
# Retorna quantidade de atendimentos por barbeiro com filtro de data - admin
@dashboard_bp.route("/atendimentos-barbeiros", methods=["GET"])
@admin_required
def get_atendimentos_barbeiros():
    data_inicio = request.args.get("data_inicio")
    data_fim = request.args.get("data_fim")

    if not data_inicio or not data_fim:
        return (
            jsonify(
                {
                    "message": "data_inicio e data_fim são obrigatórios (formato YYYY-MM-DD)"
                }
            ),
            400,
        )

    try:
        from datetime import datetime

        datetime.strptime(data_inicio, "%Y-%m-%d")
        datetime.strptime(data_fim, "%Y-%m-%d")
    except ValueError:
        return jsonify({"message": "Datas devem estar no formato YYYY-MM-DD"}), 400

    atendimentos = DashboardService.get_atendimentos_barbeiros(data_inicio, data_fim)
    return (
        jsonify(
            {
                "message": "Atendimentos por barbeiro obtidos com sucesso",
                "data": atendimentos,
            }
        ),
        200,
    )


# Ian - 16/04/2026
# Retorna o serviço mais procurado - admin
@dashboard_bp.route("/servico-mais-procurado", methods=["GET"])
@admin_required
def get_servico_mais_procurado():
    servico = DashboardService.get_servico_mais_procurado()
    return (
        jsonify(
            {"message": "Serviço mais procurado obtido com sucesso", "data": servico}
        ),
        200,
    )


# Ian - 16/04/2026
# Retorna o cliente que mais tem atendimentos - admin
@dashboard_bp.route("/cliente-mais-atendimentos", methods=["GET"])
@admin_required
def get_cliente_mais_atendimentos():
    cliente = DashboardService.get_cliente_mais_atendimentos()
    return (
        jsonify(
            {
                "message": "Cliente com mais atendimentos obtido com sucesso",
                "data": cliente,
            }
        ),
        200,
    )
