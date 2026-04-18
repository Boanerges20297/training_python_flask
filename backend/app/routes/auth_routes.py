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
from app.services.email_service import EmailService
from app.utils.error_formatter import formatar_erros_pydantic
from app.schemas.auth_schema import (
    LoginRequest,
    TokenResponse,
    LoginResponse,
    EsqueciSenhaRequest,
    RedefinirSenhaRequest,
)
from app.extensions import app_logger
from datetime import datetime
from app.extensions import db
from config import Config, DevelopmentConfig

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        try:
            data = LoginRequest(**request.get_json())
        except Exception as e:
            erros = formatar_erros_pydantic(e)
            app_logger.warning(
                "Falha estrutural de validação no payload de Login",
                extra={"erros": erros},
            )
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

        app_logger.info(
            "Login realizado com sucesso",
            extra={
                "email": data.email,
                "user_id": auth_data["user"].id,
                "role": auth_data["user"].role,
            },
        )

        response = jsonify(login_response.model_dump())

        set_access_cookies(response, auth_data["tokens"].access_token)
        set_refresh_cookies(response, auth_data["tokens"].refresh_token)
        # Vinicius - 16/04/2026
        # Adicionado log para monitorar o login
        app_logger.info(
            "Login realizado com sucesso",
            extra={
                "user_id": auth_data["user"].id,
                "role": auth_data["user"].role,
                "data_hora_atual": datetime.utcnow(),
            },
        )
        return response, 200

    except AuthServiceException as e:
        return jsonify({"Erro": str(e)}), 401

    except Exception as e:
        app_logger.error(
            "Erro interno inesperado no fluxo de Login",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
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

        app_logger.info(
            "Sessão renovada silenciosamente",
            extra={"user_id": current_user_id, "role": role},
        )
        return response, 200

    except Exception as e:
        app_logger.error(
            "Falha inesperada ao tentar renovar a sessão (refresh)",
            extra={"user_id": get_jwt_identity(), "erro_detalhe": str(e)},
            exc_info=True,
        )
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

        app_logger.info(
            "Logout concluído com sucesso e cookies limpos",
            extra={"jti": jti, "user_id": get_jwt_identity()},
        )
        return response, 200
    except Exception as e:
        app_logger.error(
            "Falha inesperada ao registrar o Logout",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return (
            jsonify({"Erro": "Erro ao fazer logout, entre em contato com o suporte."}),
            500,
        )


@auth_bp.route("/esqueci-senha", methods=["POST"])
def esqueci_senha():

    try:
        try:
            dados = EsqueciSenhaRequest(**request.get_json())
        except Exception as e:
            erros = formatar_erros_pydantic(e)
            app_logger.warning(
                "Falha estrutural de validação no payload de Esqueci a Senha",
                extra={"erros_validacao": erros},
            )
            return jsonify(erros), 400

        email = dados.email

        # Chama o Service.
        # Repare que não verificamos se deu True ou False para o usuário.
        token, usuario = AuthService.gerar_token_recuperacao_senha(email)

        link_recuperacao = (
            f"{DevelopmentConfig.FRONTEND_URL}/recuperar-senha?token={token}"
        )

        sucesso = EmailService.enviar_email_recuperacao_senha(
            email, usuario.nome, link_recuperacao
        )

        if False in sucesso:
            data_response = {
                "status": "erro",
                "mensagem": "Erro ao enviar e-mail de recuperação de senha, entre em contato com o suporte.",
            }
        else:
            data_response = {
                "status": "sucesso",
                "mensagem": "Se o e-mail estiver em nossa base de dados, um link de recuperação será enviado em instantes.",
            }
            app_logger.info(
                "E-mail de recuperação de senha enviado com sucesso",
                extra={"email": email, "data_response": data_response},
            )
        db.session.commit()
        return jsonify(data_response), 200
    except Exception as e:
        db.session.rollback()
        app_logger.error(
            "Falha inesperada ao enviar e-mail de recuperação de senha",
            extra={"email": email, "erro_detalhe": str(e)},
            exc_info=True,
        )
        return (
            jsonify(
                {
                    "Erro": "Erro ao enviar e-mail de recuperação de senha, entre em contato com o suporte."
                }
            ),
            500,
        )


@auth_bp.route("/redefinir-senha", methods=["POST"])
def redefinir_senha():
    try:
        try:
            dados = RedefinirSenhaRequest(**request.get_json())
        except Exception as e:
            erros = formatar_erros_pydantic(e)
            app_logger.warning(
                "Falha estrutural de validação no payload para redefinir senha",
                extra={"erros_validacao": erros},
            )
            return jsonify(erros), 400

        # A validação restritiva em tempo de requisição de força do backend está protegida pelo Pydantic

        # O Service faz o trabalho pesado de checar o banco e fazer o hash
        sucesso, mensagem = AuthService.redefinir_senha(dados.token, dados.nova_senha)

        if sucesso:
            db.session.commit()
            return jsonify({"status": "sucesso", "mensagem": mensagem}), 200
        else:
            db.session.rollback()
            # Retorna 400 (Bad Request) se o token for inválido ou expirado
            return jsonify({"status": "erro", "mensagem": mensagem}), 400
    except Exception as e:
        db.session.rollback()
        app_logger.error(
            "Falha inesperada ao redefinir senha",
            extra={"erro_detalhe": str(e)},
            exc_info=True,
        )
        return (
            jsonify(
                {"Erro": "Erro ao redefinir senha, entre em contato com o suporte."}
            ),
            500,
        )
