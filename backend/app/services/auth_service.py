from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.admin import Admin
from app.models.barbeiro import Barbeiro
from app.models.cliente import Cliente
from app.schemas.auth_schema import (
    LoginRequest,
    LoginResponse,
    UserResponse,
    TokenResponse,
)
from app.extensions import app_logger
# felipe
from app.utils.audit import log_evento_auditoria

MOCK_BLOCKLIST = set()


class AuthServiceException(Exception):
    def __init__(self, message):
        super().__init__(message)


class AuthService:
    # Vinicius 11/04/2026
    # Adicionado tipagem para o método authenticate_user
    @staticmethod
    def authenticate_user(
        login_request: LoginRequest,
    ) -> dict[UserResponse, TokenResponse]:
        """Busca o usuário e gera os tokens se a senha bater."""
        email = login_request.email
        senha = login_request.senha

        if admin := Admin.query.filter_by(email=email).first():
            user = admin
            role = "admin"
        elif barbeiro := Barbeiro.query.filter_by(email=email).first():
            user = barbeiro
            role = "barbeiro"
        elif cliente := Cliente.query.filter_by(email=email).first():
            user = cliente
            role = "cliente"
        else:
            # felipe - Log de Auditoria para falha de login
            log_evento_auditoria("Tentativa de login: E-mail não encontrado", extra_data={"email_tentado": email})
            raise AuthServiceException("Credenciais inválidas")

        if user and not user.verificar_senha(senha):
            # felipe - Log de Auditoria para falha de senha
            log_evento_auditoria("Tentativa de login: Senha incorreta", extra_data={"email_tentado": email, "role": role})
            raise AuthServiceException("Credenciais inválidas")

        user_id = str(user.id)
        additional_claims = {"role": role}

        # O Serviço cria os tokens puros, mas NÃO mexe em cookies
        access_token = create_access_token(
            identity=user_id, additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=user_id, additional_claims=additional_claims
        )

        # felipe - Log de Auditoria para login bem sucedido
        log_evento_auditoria("Login realizado com sucesso", recurso_id=user_id, extra_data={"role": role})

        return {
            "user": UserResponse(id=user_id, role=role),
            "tokens": TokenResponse(
                access_token=access_token, refresh_token=refresh_token
            ),
        }

    #josue minima alteraçao  @staticmethod dupicado
    # Vinicius 11/04/2026
    # Adicionado tipagem para o método renew_access_token
    @staticmethod
    def renew_access_token(current_user_id: str, role: str) -> str:
        """Gera um novo access token baseado nos dados do refresh token."""
        return create_access_token(
            identity=current_user_id, additional_claims={"role": role}
        )

    # Vinicius 11/04/2026
    # Adicionado tipagem para o método revoke_token
    @staticmethod
    def revoke_token(jti: str) -> None:
        """Adiciona o ID do token na Blocklist (futuro Redis)."""
        # felipe - Log de Auditoria
        log_evento_auditoria("Token JWT revogado (Logout)", extra_data={"jti": jti})
        MOCK_BLOCKLIST.add(jti)

    # Vinicius 11/04/2026
    # Adicionado tipagem para o método is_token_revoked
    @staticmethod
    def is_token_revoked(jti: str) -> bool:
        """Verifica se o token está na blocklist."""
        return jti in MOCK_BLOCKLIST
