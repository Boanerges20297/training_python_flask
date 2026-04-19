from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    create_access_token,
    create_refresh_token,
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
from app.models.barbeiro import Barbeiro
from app.models.cliente import Cliente
from app.schemas.client_schema import ClienteSchema
from sqlalchemy.exc import IntegrityError
from app.services.email_service import EmailService
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
        usuario_dados = {
            "id": auth_data["user"].id,
            "nome": auth_data["user"].nome,
            "email": auth_data["user"].email,
            "role": auth_data["user"].role,
        }

        login_response = LoginResponse(
            mensagem="Login realizado com sucesso", dados={"usuario": usuario_dados}
        )

        app_logger.info(
            "Login realizado com sucesso",
            extra={
                "email": data.email,
                "user_id": auth_data["user"].id,
                "role": auth_data["user"].role,
            },
        )

        response = jsonify(
            {
                "sucesso": True,
                "mensagem": "Login realizado com sucesso",
                "dados": {"usuario": usuario_dados},
            }
        )

        set_access_cookies(response, auth_data["tokens"].access_token)
        set_refresh_cookies(response, auth_data["tokens"].refresh_token)

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


@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def check_session():
    try:
        # Extrai os dados do payload do JWT configurado via cookies
        current_user_id = get_jwt_identity()
        role = get_jwt().get("role")

        # Busca o usuário real do banco conforme a role
        user = None
        if role == "cliente":
            user = Cliente.query.get(current_user_id)
        elif role == "barbeiro":
            user = Barbeiro.query.get(current_user_id)

        user_info = {
            "id": current_user_id,
            "role": role,
            "nome": (
                user.nome
                if user
                else ("Admin" if role == "admin" else "Usuário Desconhecido")
            ),
            "email": (
                user.email
                if user
                else (
                    "admin@barbabyte.com"
                    if role == "admin"
                    else "email@desconhecido.com"
                )
            ),
        }

        app_logger.info(
            "Verificação de sessão (protected) concluída com sucesso.",
            extra={"user_id": current_user_id},
        )
        return jsonify({"sucesso": True, "dados": {"usuario": user_info}}), 200
    except Exception as e:
        app_logger.error("Sessão espúria ou inválida disparou protegida", exc_info=True)
        return (
            jsonify({"sucesso": False, "mensagem": "Sessão inválida ou expirada"}),
            401,
        )


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Ponte para o cadastro de clientes via aba de autenticação.
    O frontend espera /api/auth/register
    """
    try:
        try:
            data = ClienteSchema(**request.get_json())
        except Exception as e:
            erros = formatar_erros_pydantic(e)
            return jsonify({"erros_validacao": erros}), 400

        # Criar cliente e salvar no banco
        cliente = Cliente(**data.model_dump())
        cliente.senha = data.senha
        db.session.add(cliente)

        # Envio de e-mail de boas vindas
        try:
            EmailService.enviar_email_boas_vindas(
                destinatario=cliente.email, nome_usuario=cliente.nome
            )
        except Exception as e:
            app_logger.warning(f"Falha ao enviar e-mail de boas-vindas: {str(e)}")

        db.session.commit()

        # Após registrar, logamos o usuário automaticamente gerando os tokens
        user_id = str(cliente.id)
        role = "cliente"

        access_token = create_access_token(
            identity=user_id, additional_claims={"role": role}
        )
        refresh_token = create_refresh_token(
            identity=user_id, additional_claims={"role": role}
        )

        usuario_dados = {
            "id": cliente.id,
            "nome": cliente.nome,
            "email": cliente.email,
            "role": role,
        }

        response = jsonify(
            {
                "sucesso": True,
                "mensagem": "Cadastro realizado com sucesso",
                "dados": {"usuario": usuario_dados},
            }
        )

        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response, 201

    except IntegrityError:
        db.session.rollback()
        return jsonify({"erro": "E-mail ou Telefone já estão em uso."}), 409
    except Exception as e:
        db.session.rollback()
        app_logger.error("Erro no register:", exc_info=True)
        return jsonify({"erro": str(e)}), 500


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
