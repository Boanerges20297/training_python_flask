from app.repositories.agendamento_repository import AgendamentoRepository
# Vinicius 20/04/2026
# Módulo financeiro estrito: Service de Relatórios Escaláveis (Paginados)

import calendar
from decimal import Decimal
from datetime import datetime, timezone
from app.modules.agendamento.model import Agendamento


class FinanceiroService:
    @staticmethod
    def _valor_agendamento(agendamento: Agendamento) -> Decimal:
        if agendamento.preco_cobrado is not None:
            return Decimal(str(agendamento.preco_cobrado))
        return sum(Decimal(str(servico.preco)) for servico in agendamento.servicos)

    @staticmethod
    def _servicos_label(agendamento: Agendamento) -> str:
                # Josue 23/04/2026 - Refatoração M2M:
                # Agora somamos todos os serviços do agendamento (M2M), pois não existe mais servico_id único.
                # Se preco_cobrado foi definido manualmente (caso especial), ele tem prioridade.
        nomes = [servico.nome for servico in agendamento.servicos]
        return ", ".join(nomes) if nomes else "Sem serviços"

    @staticmethod
    def _base_filter(mes: int, ano: int) -> list:
        # Josue 23/04/2026 - Sugestão: este filtro pode virar um helper reutilizável para outros módulos (ex: dashboard, agendamento).
                # Josue 23/04/2026 - Exibe todos os nomes dos serviços vinculados ao agendamento (M2M).
        """
        Produz os filtros centrais para não precisarmos repetir as condicionais em múltiplas queries.

        Por que usamos calendar e UTC?
        1. Para ter certeza absoluta que o mês termina no dia certo (28, 30 ou 31).
        2. Garantir que as horas terminem precisamente às 23:59:59.
        3. Prevenir falhas em anos bissextos (Fevereiro 29).
        """
        start_date = datetime(ano, mes, 1, tzinfo=timezone.utc)
        last_day = calendar.monthrange(ano, mes)[1]
        end_date = datetime(ano, mes, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)

        # Fatores da fonte da verdade financeira:
        # Apenas serviços que já aconteceram E que o cliente fechou a conta (pagou).
        return [
            Agendamento.status == Agendamento.STATUS_CONCLUIDO,
            Agendamento.pago == True,
            Agendamento.data_agendamento >= start_date,
            Agendamento.data_agendamento <= end_date,
        ]

    @staticmethod
    def obter_relatorio(mes: int, ano: int, pagina: int = 1, limite: int = 50) -> dict:
        # Josue 23/04/2026 - Sugestão: acesso ao banco pode ser feito via camada de repositório, separando queries do service.
        # Regatamos a âncora mestre das condições de pesquisa de data e status
        filtros = FinanceiroService._base_filter(mes, ano)
        # Josue 23/04/2026 - Refatorado para modelo M2M: cálculos e agregações agora usam todos os serviços do agendamento.
        # Josue 23/04/2026 - Busca via repositório, desacoplando service do ORM.
        agendamentos_query = AgendamentoRepository.buscar_por_filtros(
            filtros, order_by=Agendamento.data_agendamento.desc()
        )
    
        agendamentos = agendamentos_query.all()
        # Josue 23/04/2026 - Sugestão: validar saída com schema Pydantic antes de retornar para o frontend.
        qtd_agendamentos = len(agendamentos)
        receita_total = float(
            sum(FinanceiroService._valor_agendamento(ag) for ag in agendamentos)
        )
        ticket_medio = receita_total / qtd_agendamentos if qtd_agendamentos > 0 else 0.0

        lucro_por_barbeiro_map = {}
        # Josue 23/04/2026 - Sugestão: agregações como esta podem ser centralizadas em helpers para evitar repetição em outros relatórios.
        for agendamento in agendamentos:
            chave = agendamento.barbeiro_id
            if chave not in lucro_por_barbeiro_map:
                lucro_por_barbeiro_map[chave] = {
                    "barbeiro_nome": agendamento.barbeiro.nome,
                    "lucro": 0.0,
                }
            lucro_por_barbeiro_map[chave]["lucro"] += float(
                FinanceiroService._valor_agendamento(agendamento)
            )

        lucro_por_barbeiro = sorted(
            [
                {
                    "barbeiro_nome": item["barbeiro_nome"],
                    "lucro": round(item["lucro"], 2),
                }
                for item in lucro_por_barbeiro_map.values()
            ],
            key=lambda item: item["lucro"],
            reverse=True,
        )

        # =======================================================
        # CONSULTA 3: Offset Pagination para as Notas Fiscais (Extrato)
        # =======================================================
        # Mecanismo de Prevenção de Estouro de Memória (Vazamento).
        # Se tivéssemos 50,000 registros, o '.all()' puro travaria o servidor.
        # O uso tático de '.offset()' (Pular N registros) e '.limit()' (Pegar apenas os próximos N)
        # garante que só uma "página" minúscula entre no processador Python por vez.
        notas_query = (
            agendamentos_query.offset((pagina - 1) * limite).limit(limite).all()
        )
        # Josue - offset/limit evita carregar o extrato inteiro quando o volume financeiro crescer.

        notas_fiscais = []
        for row in notas_query:
            notas_fiscais.append(
                {
                    "agendamento_id": row.id,
                    # Josue 23/04/2026 - Cada nota fiscal pode ter múltiplos serviços (M2M), exibidos em string.
                    "data": row.data_agendamento.isoformat(),
                    "barbeiro_nome": row.barbeiro.nome,
                    "cliente_nome": row.cliente.nome,
                    "servico": FinanceiroService._servicos_label(row),
                    "valor": float(FinanceiroService._valor_agendamento(row)),
                }
            )

        # O service retorna dados crus. A rota é responsável por montar o envelope de paginação.
        return {
            "items": notas_fiscais,
            "total": qtd_agendamentos,
            "pagina": pagina,
            "per_page": limite,
            "resumo": {
                "receita_total": round(receita_total, 2),
                "ticket_medio": round(ticket_medio, 2),
                "total_agendamentos_pagos": qtd_agendamentos,
            },
            "lucro_por_barbeiro": lucro_por_barbeiro,
        }
