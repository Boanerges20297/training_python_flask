from flask_jwt_extended import create_access_token, create_refresh_token
from app.models.admin import Admin
from app.models.barbeiro import Barbeiro
from app.models.cliente import Cliente          #josue minima alteração
from app.schemas.auth_schema import LoginRequest, LoginResponse, AuthServiceResponse



MOCK_BLOCKLIST = set()


class AuthServiceException(Exception):
    def __init__(self, message):
        super().__init__(message)


class AuthService:
    @staticmethod
    def authenticate_user(login_request: LoginRequest) -> AuthServiceResponse:
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
            raise AuthServiceException("Credenciais inválidas")

        if user and not user.verificar_senha(senha):
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

        return {
            "user": {"id": user_id, "role": role},
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    @staticmethod
    def renew_access_token(current_user_id, role):
        """Gera um novo access token baseado nos dados do refresh token."""
        return create_access_token(
            identity=current_user_id, additional_claims={"role": role}
        )

    @staticmethod
    def revoke_token(jti):
        """Adiciona o ID do token na Blocklist (futuro Redis)."""
        MOCK_BLOCKLIST.add(jti)

    @staticmethod
    def is_token_revoked(jti):
        """Verifica se o token está na blocklist."""
        return jti in MOCK_BLOCKLIST
