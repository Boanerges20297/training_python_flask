from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.services.dashboard_service import DashboardService
from app.utils.decorators import admin_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/geral", methods=["GET"])
@admin_required
def get_dashboard_geral():
    # Pega query param ?dias=30 (default = 30)
    dias = request.args.get("dias", 30, type=int)

    # Validação básica de segurança
    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    # Chama o service que faz todos os cálculos
    dashboard = DashboardService.get_dashboard_geral(dias=dias)

    # Retorna os dados
    return jsonify({"message": "Dashboard geral obtido com sucesso", "data": dashboard}), 200


@dashboard_bp.route("/receita-periodo", methods=["GET"])
@admin_required
def get_receita_periodo():
    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    # Reutiliza o dashboard geral (evita duplicar lógica)
    dashboard = DashboardService.get_dashboard_geral(dias=dias)

    # Extrai apenas a parte de receita
    receita_diaria = dashboard.get("receita_diaria", [])

    return jsonify({"message": "Receita por período obtida com sucesso", "data": receita_diaria}), 200


@dashboard_bp.route("/barbeiro/<int:barbeiro_id>", methods=["GET"])
@jwt_required()
def get_dashboard_barbeiro(barbeiro_id):
    # Pega dados do token
    claims = get_jwt()
    role = claims.get("role")
    user_id = claims.get("sub")

    # Barbeiro só pode ver o próprio dashboard
    if role == "barbeiro" and int(user_id) != barbeiro_id:
        return jsonify({"message": "Acesso negado"}), 403

    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    # Busca dados do barbeiro
    dashboard = DashboardService.get_dashboard_barbeiro(barbeiro_id, dias=dias)

    # Se não existir
    if dashboard is None:
        return jsonify({"message": "Barbeiro não encontrado"}), 404

    return jsonify({"message": "Dashboard do barbeiro obtido com sucesso", "data": dashboard}), 200


@dashboard_bp.route("/servicos-barbeiro/<int:barbeiro_id>", methods=["GET"])
@jwt_required()
def get_servicos_barbeiro(barbeiro_id):
    claims = get_jwt()
    role = claims.get("role")
    user_id = claims.get("sub")

    # Mesma regra de segurança
    if role == "barbeiro" and int(user_id) != barbeiro_id:
        return jsonify({"message": "Acesso negado"}), 403

    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    dashboard = DashboardService.get_dashboard_barbeiro(barbeiro_id, dias=dias)

    if dashboard is None:
        return jsonify({"message": "Barbeiro não encontrado"}), 404

    # Retorna só os serviços (recorte do dashboard)
    servicos_realizados = dashboard.get("servicos_realizados", [])

    return jsonify({"message": "Serviços realizados pelo barbeiro obtidos com sucesso", "data": servicos_realizados}), 200


@dashboard_bp.route("/horarios-populares", methods=["GET"])
@admin_required
def get_horarios_populares():
    dias = request.args.get("dias", 30, type=int)

    if dias < 1 or dias > 365:
        return jsonify({"message": "Dias deve estar entre 1 e 365"}), 400

    dashboard = DashboardService.get_dashboard_geral(dias=dias)

    # Extrai só os horários mais movimentados
    top_5_horarios = dashboard.get("top_5_horarios", [])

    return jsonify({"message": "Horários populares obtidos com sucesso", "data": top_5_horarios}), 200