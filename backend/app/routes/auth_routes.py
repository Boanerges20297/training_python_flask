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
from app.extensions import app_logger

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        try:
            data = LoginRequest(**request.get_json())
        except Exception as e:
            erros = formatar_erros_pydantic(e)
            app_logger.warning("Falha estrutural de validação no payload de Login", extra={"erros": erros})
            return jsonify(erros), 400

        # 1. Delega a regra de negócio para o Serviço
        auth_data = AuthService.authenticate_user(data)

        # 2. Lida com a falha (Regra de HTTP)
        if not auth_data:
            return jsonify({"msg": "Credenciais inválidas"}), 401

        # 3. Lida com o sucesso (Monta a resposta e injeta cookies)
        login_response = LoginResponse(
            mensagem="Login realizado com sucesso", 
            dados={"usuario": {"id": str(auth_data["user"].id), "role": auth_data["user"].role}}
        )

        app_logger.info("Login realizado com sucesso", extra={"email": data.email, "user_id": auth_data["user"].id, "role": auth_data["user"].role})

        response = jsonify(login_response.model_dump())

        set_access_cookies(response, auth_data["tokens"].access_token)
        set_refresh_cookies(response, auth_data["tokens"].refresh_token)

        return response, 200

    except AuthServiceException as e:
        return jsonify({"Erro": str(e)}), 401

    except Exception as e:
        app_logger.error("Erro interno inesperado no fluxo de Login", extra={"erro_detalhe": str(e)}, exc_info=True)
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

        app_logger.info("Sessão renovada silenciosamente", extra={"user_id": current_user_id, "role": role})
        return response, 200

    except Exception as e:
        app_logger.error("Falha inesperada ao tentar renovar a sessão (refresh)", extra={"user_id": get_jwt_identity(), "erro_detalhe": str(e)}, exc_info=True)
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

        app_logger.info("Logout concluído com sucesso e cookies limpos", extra={"jti": jti, "user_id": get_jwt_identity()})
        return response, 200
    except Exception as e:
        app_logger.error("Falha inesperada ao registrar o Logout", extra={"erro_detalhe": str(e)}, exc_info=True)
        return (
            jsonify({"Erro": "Erro ao fazer logout, entre em contato com o suporte."}),
            500,
        )


@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def check_session():
    try:
        # Extrai os dados do payload do JWT configurado via cookies
        current_user_id = get_jwt_identity()
        role = get_jwt().get("role")

        # Mock provisório de nome e email, caso o frontend requeira até implementarmos o fetchUser real
        user_info = {
            "id": current_user_id,
            "role": role,
            "nome": "Usuário Logado",
            "email": "usuario@logado.com"
        }

        app_logger.info("Verificação de sessão (protected) concluída com sucesso.", extra={"user_id": current_user_id})
        return jsonify({"sucesso": True, "dados": {"usuario": user_info}}), 200
    except Exception as e:
        app_logger.error("Sessão espúria ou inválida disparou protegida", exc_info=True)
        return jsonify({"sucesso": False, "mensagem": "Sessão inválida ou expirada"}), 401
