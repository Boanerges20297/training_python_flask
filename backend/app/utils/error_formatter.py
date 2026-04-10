from pydantic import ValidationError


def formatar_erros_pydantic(e: ValidationError):
    """
    Transforma os erros brutos do Pydantic em um dicionário limpo e amigável.
    """
    erros_limpos = {}

    for erro in e.errors():
        # erro["loc"] é uma tupla, ex: ('body', 'email'). Pegamos o último item.
        campo = str(erro["loc"][-1])
        tipo_erro = erro["type"]

        # --- DICIONÁRIO DE TRADUÇÃO SÊNIOR ---
        if tipo_erro == "missing":
            mensagem = "Este campo é obrigatório."

        elif (
            tipo_erro == "value_error"
        ):  # Erro genérico de valor (ex: e-mail inválido do EmailStr)
            mensagem = "Formato inválido."

        elif tipo_erro == "string_too_short":
            minimo = erro.get("ctx", {}).get("min_length", "?")
            mensagem = f"Muito curto. Requer no mínimo {minimo} caracteres."

        elif tipo_erro == "string_too_long":
            maximo = erro.get("ctx", {}).get("max_length", "?")
            mensagem = f"Muito longo. O limite é de {maximo} caracteres."

        elif tipo_erro == "extra_forbidden":
            mensagem = "Campo não reconhecido pelo sistema."

        else:
            # Fallback caso seja um erro muito específico que não mapeamos
            mensagem = erro["msg"]

        # Salva a mensagem bonitinha no dicionário usando o nome do campo como chave
        erros_limpos[campo] = mensagem

    return {
        "msg": "Encontramos alguns problemas nos dados enviados.",
        "detalhes": erros_limpos,
    }
