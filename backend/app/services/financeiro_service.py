# Vinicius 20/04/2026
# Módulo financeiro estrito: Service de Relatórios Escaláveis (Paginados)

import calendar
from datetime import datetime, timezone
from sqlalchemy import func, desc
from app import db
from app.models.agendamento import Agendamento
from app.models.barbeiro import Barbeiro
from app.models.cliente import Cliente
from app.models.servico import Servico


class FinanceiroService:
    @staticmethod
    def _base_filter(mes: int, ano: int) -> list:
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
        # Regatamos a âncora mestre das condições de pesquisa de data e status
        filtros = FinanceiroService._base_filter(mes, ano)

        # =======================================================
        # CONSULTA 1: Total e Ticket Médio (Delegação para o Banco)
        # =======================================================
        # Esta é uma operação O(1) de altíssima performance. Em vez de trazermos
        # os dados para o Python, usamos o 'func.sum' e 'func.count' do SQLAlchemy.
        # O 'func.coalesce' funciona como um salva-vidas: se o salão não teve vendas
        # naquele mês (sum retornaria Null), ele injeta 0.0 de forma segura.
        agg_result = (
            db.session.query(
                func.coalesce(func.sum(Servico.preco), 0.0),
                func.count(Agendamento.id),
            )
            .join(Servico, Agendamento.servico_id == Servico.id)
            .filter(*filtros)
            .first()
        )

        receita_total = float(agg_result[0]) if agg_result else 0.0
        qtd_agendamentos = int(agg_result[1]) if agg_result else 0
        ticket_medio = receita_total / qtd_agendamentos if qtd_agendamentos > 0 else 0.0

        # =======================================================
        # CONSULTA 2: Agrupamento Dinâmico por Barbeiro (Ranking)
        # =======================================================
        # Aqui geramos o relatório do qual barbeiro faturou mais na barbearia.
        # A mágica acontece no '.group_by(Barbeiro.id)', que faz o banco de dados
        # compactar os milhares de cortes em algumas dezenas de linhas: uma para
        # cada barbeiro somando ('func.sum') tudo automaticamente e já ordenado
        # decrescentemente ('.order_by(desc("lucro"))').
        barbeiros_query = (
            db.session.query(
                Barbeiro.nome.label("nome"),
                func.coalesce(func.sum(Servico.preco), 0.0).label("lucro"),
            )
            .join(Agendamento, Agendamento.barbeiro_id == Barbeiro.id)
            .join(Servico, Agendamento.servico_id == Servico.id)
            .filter(*filtros)
            .group_by(Barbeiro.id, Barbeiro.nome)
            .order_by(desc("lucro"))
            .all()
        )

        lucro_por_barbeiro = [
            {"barbeiro_nome": r.nome, "lucro": round(float(r.lucro), 2)}
            for r in barbeiros_query
        ]

        # =======================================================
        # CONSULTA 3: Offset Pagination para as Notas Fiscais (Extrato)
        # =======================================================
        # Mecanismo de Prevenção de Estouro de Memória (Vazamento).
        # Se tivéssemos 50,000 registros, o '.all()' puro travaria o servidor.
        # O uso tático de '.offset()' (Pular N registros) e '.limit()' (Pegar apenas os próximos N)
        # garante que só uma "página" minúscula entre no processador Python por vez.
        notas_query = (
            db.session.query(
                Agendamento.id.label("agendamento_id"),
                Agendamento.data_agendamento,
                Barbeiro.nome.label("barbeiro_nome"),
                Cliente.nome.label("cliente_nome"),
                Servico.nome.label("servico_nome"),
                Servico.preco.label("valor"),
            )
            .join(Barbeiro, Agendamento.barbeiro_id == Barbeiro.id)
            .join(Cliente, Agendamento.cliente_id == Cliente.id)
            .join(Servico, Agendamento.servico_id == Servico.id)
            .filter(*filtros)
            .order_by(Agendamento.data_agendamento.desc())
            .offset((pagina - 1) * limite)
            .limit(limite)
            .all()
        )

        notas_fiscais = []
        for row in notas_query:
            notas_fiscais.append(
                {
                    "agendamento_id": row.agendamento_id,
                    "data": row.data_agendamento.isoformat(),
                    "barbeiro_nome": row.barbeiro_nome,
                    "cliente_nome": row.cliente_nome,
                    "servico": row.servico_nome,
                    "valor": float(row.valor),
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
