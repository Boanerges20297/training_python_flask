from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

# Importamos o nosso novo serviço
from app.services.auth_service import AuthService, AuthServiceException
from app.utils.error_formatter import formatar_erros_pydantic
from app.schemas.auth_schema import LoginRequest, TokenResponse, LoginResponse

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        try:
            data = LoginRequest(**request.get_json())
        except Exception as e:
            erros = formatar_erros_pydantic(e)
            return jsonify(erros), 400

        # 1. Delega a regra de negócio para o Serviço
        auth_data = AuthService.authenticate_user(data)

        # 2. Lida com a falha (Regra de HTTP)
        if not auth_data:
            return jsonify({"msg": "Credenciais inválidas"}), 401

        # 3. Lida com o sucesso (Monta a resposta e injeta cookies)
        # Vinicius 11/04/2026
        # Modificado o codigo para utilizar LoginResponse e TokenResponse para seguir o padrão do projeto
        login_response = LoginResponse(
            msg="Login realizado com sucesso", user=auth_data["user"]
        )

        tokens = TokenResponse(
            access_token=auth_data["tokens"]["access_token"],
            refresh_token=auth_data["tokens"]["refresh_token"],
        )

        response = jsonify(login_response.model_dump())

        set_access_cookies(response, tokens.access_token)
        set_refresh_cookies(response, tokens.refresh_token)

        return response, 200

    except AuthServiceException as e:
        return jsonify({"Erro": str(e)}), 401

    except Exception as e:
        return (
            jsonify({"Erro": "Erro ao fazer login, entre em contato com o suporte."}),
            500,
        )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    try:
        # Extrai os dados do request atual
        current_user_id = get_jwt_identity()
        role = get_jwt().get("role")

        # Delega a criação para o Serviço
        new_access_token = AuthService.renew_access_token(current_user_id, role)

        response = jsonify({"msg": "Sessão renovada silenciosamente"})
        set_access_cookies(response, new_access_token)

        return response, 200

    except Exception as e:
        return (
            jsonify(
                {"Erro": "Erro ao renovar sessão, entre em contato com o suporte."}
            ),
            500,
        )


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    try:
        # Extrai o ID do token e manda o Serviço revogar
        jti = get_jwt()["jti"]
        AuthService.revoke_token(jti)

        # Limpa os cookies (Regra de HTTP)
        response = jsonify({"msg": "Logout efetuado. Cookies limpos."})
        unset_jwt_cookies(response)

        return response, 200
    except Exception as e:
        return (
            jsonify({"Erro": "Erro ao fazer logout, entre em contato com o suporte."}),
            500,
        )
