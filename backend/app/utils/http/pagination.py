import math


def formatar_retorno_paginacao(
    items: list, total: int, page: int, per_page: int, label_items: str = "items"
) -> dict:
    """
    Padroniza todos os retornos de paginação do sistema espalhando as variáveis nativamente no dicionário local
    sem agrupador extra, para manter compatibilidade com a maioria do formato que já existe no frontend.
    """
    total_paginas = math.ceil(total / per_page) if per_page > 0 else 1

    return {
        label_items: items,
        "total": total,
        "items_nessa_pagina": len(items),
        "pagina": page,
        "per_page": per_page,
        "total_paginas": total_paginas,
        "tem_proxima": page < total_paginas,
        "tem_pagina_anterior": page > 1,
    }
