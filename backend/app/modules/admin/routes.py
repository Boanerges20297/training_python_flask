from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from app.utils.security.decorators import role_required
from flask_jwt_extended import jwt_required
from app.utils.http.error_formatter import formatar_erros_pydantic

from app.modules.admin.service import AdminService
from app.modules.admin.schema import (
    AdminCreate,
    AdminUpdate,
    AdminResponse,
)
from app.utils.http.pagination import formatar_retorno_paginacao


# Criando o Blueprint para centralizar as rotas do admin
admin_bp = Blueprint("admin", __name__, url_prefix="/api/admins")


@admin_bp.route("", methods=["POST"])
@role_required(["admin"])
def criar_admin():
    """Rota para criar um novo administrador ou gerente"""
    try:
        # 1. Tradução: JSON de entrada -> Pydantic Schema
        try:
            dados_entrada = AdminCreate(**request.get_json())
        except Exception as e:
            erros = formatar_erros_pydantic(e)
            return (
                jsonify({"erro": "Erro de validação dos dados", "detalhes": erros}),
                400,
            )

        # 2. Delegação: A Service faz a lógica pesada e salva no banco
        novo_admin = AdminService.criar_admin(dados_entrada)

        # 3. Resposta: Modelo do Banco -> Pydantic Response -> JSON Seguro
        # O model_validate (antigo from_orm) transforma o objeto SQLAlchemy no Schema seguro
        resposta = AdminResponse.model_validate(novo_admin)

        return jsonify(resposta.model_dump()), 201

    except ValueError as e:
        # Erro de regra de negócio da Service (Ex: email duplicado)
        return jsonify({"erro": str(e)}), 400


@admin_bp.route("", methods=["GET"])
@role_required(["admin"])
def listar_admins():
    """Rota para listar admins com paginação"""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    paginacao = AdminService.listar_admins(page, per_page)

    admin_dicts = [
        AdminResponse.model_validate(admin).model_dump() for admin in paginacao.items
    ]

    return (
        jsonify(
            {
                "sucesso": True,
                "dados": formatar_retorno_paginacao(
                    admin_dicts, paginacao.total, paginacao.page, paginacao.per_page
                ),
            }
        ),
        200,
    )


@admin_bp.route("/<int:admin_id>", methods=["PATCH"])
@role_required(["admin"])
def editar_admin(admin_id):
    """Rota para atualizar dados do admin parcialmente"""
    try:
        dados_entrada = AdminUpdate(**request.get_json())
        admin_editado = AdminService.editar_admin(admin_id, dados_entrada)

        resposta = AdminResponse.model_validate(admin_editado)
        return jsonify(resposta.model_dump()), 200

    except ValidationError as e:
        return (
            jsonify({"erro": "Erro de validação dos dados", "detalhes": e.errors()}),
            400,
        )
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    # O get_or_404 da Service já cuida do Erro 404 automaticamente se o ID não existir!


@admin_bp.route("/<int:admin_id>/status", methods=["PATCH"])
@role_required(["admin"])
def alternar_status(admin_id):
    """Rota específica para ativar/desativar o admin (Sem enviar body)"""
    try:
        admin_atualizado = AdminService.alternar_status(admin_id)
        resposta = AdminResponse.model_validate(admin_atualizado)
        return jsonify(resposta.model_dump()), 200

    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
