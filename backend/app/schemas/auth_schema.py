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


class EsqueciSenhaRequest(BaseModel):
    email: EmailStr = Field(
        min_length=10, max_length=100, description="E-mail do usuário cadastrado"
    )

    model_config = ConfigDict(extra="forbid")


class RedefinirSenhaRequest(BaseModel):
    token: str = Field(min_length=10, description="Token de recuperação de senha")
    nova_senha: str = Field(
        min_length=6, max_length=256, description="Nova senha escolhida"
    )

    model_config = ConfigDict(extra="forbid")


# --- SCHEMAS DE SAÍDA (O que o Backend devolve) ---
class UserResponse(BaseModel):
    id: int = Field(description="ID do usuário")
    nome: str = Field(description="Nome do usuário")
    email: str = Field(description="E-mail do usuário")
    role: str = Field(description="Role do usuário")


class TokenResponse(BaseModel):
    access_token: str = Field(description="Token de acesso")
    refresh_token: str = Field(description="Token de refresh")


class LoginResponseDados(BaseModel):
    usuario: UserResponse
    token: str = Field(default="", description="Token de preenchimento provisório para typescript (em JWT cookie true não usa)")

class LoginResponse(BaseModel):
    sucesso: bool = True
    mensagem: str = Field(description="Mensagem de sucesso")
    dados: LoginResponseDados
