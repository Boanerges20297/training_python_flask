# Vinicius - 08/04/2026
# Criação do arquivo de schema para o login

from pydantic import BaseModel, Field, EmailStr


class LoginSchema(BaseModel):
    email: EmailStr = Field(
        ..., min_length=10, max_length=100, description="E-mail do usuário"
    )
    senha: str = Field(
        ..., min_length=6, max_length=100, description="Senha do usuário"
    )

    model_config = {"extra": "forbid", "str_lowercase": True}
