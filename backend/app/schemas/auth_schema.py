# Vinicius - 08/04/2026
# Criação do arquivo de schema para o login

from pydantic import BaseModel, Field, EmailStr, ConfigDict


# --- SCHEMAS DE ENTRADA (O que o Frontend manda) ---
class LoginRequest(BaseModel):
    # Exige que seja um e-mail válido (ex: barra formato incorreto na porta da API)
    email: EmailStr = Field(
        min_length=10, max_length=100, description="E-mail do usuário"
    )
    # Exige que a senha tenha no mínimo 3 caracteres (ajuste conforme a regra)
    senha: str = Field(min_length=6, max_length=256, description="Senha do usuário")

    model_config = ConfigDict(extra="forbid")


# --- SCHEMAS DE SAÍDA (O que o Backend devolve) ---
class UserResponse(BaseModel):
    id: str = Field(description="ID do usuário")
    role: str = Field(description="Role do usuário")


class TokenResponse(BaseModel):
    access_token: str = Field(description="Token de acesso")
    refresh_token: str = Field(description="Token de refresh")


class AuthServiceResponse(BaseModel):
    user: UserResponse = Field(description="Dados do usuário")
    tokens: TokenResponse = Field(description="Tokens de acesso e refresh")


class LoginResponse(BaseModel):
    msg: str = Field(description="Mensagem de sucesso")
    user: UserResponse
    tokens: TokenResponse
