from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import desc, func

from app import db
from app.modules.agendamento.model import Agendamento
from app.modules.agendamento.association import AgendamentoServico
from app.modules.barbeiro.model import Barbeiro
from app.modules.cliente.model import Cliente
from app.modules.servico.model import Servico
from app.modules.barbeiro.service import BarbeiroService


class DashboardService:
    @staticmethod
    def _valor_agendamento(agendamento: Agendamento) -> Decimal:
        if agendamento.preco_cobrado is not None:
            return Decimal(str(agendamento.preco_cobrado))
        return sum(Decimal(str(servico.preco)) for servico in agendamento.servicos)

    @staticmethod
    def _duracao_total_agendamento(agendamento: Agendamento) -> int:
        return sum(servico.duracao_minutos for servico in agendamento.servicos)

    @staticmethod
    def get_dashboard_geral(dias=30):
        # Janela temporal única (UTC) para manter consistência entre todos os KPIs.
        data_inicio = DashboardService._period_start_from_days(dias)
        data_fim = datetime.now(timezone.utc)

        # _base_query centraliza os filtros; cada chamada varia apenas status/barbeiro.
        agendamentos_concluidos = DashboardService._base_query(
            data_inicio, data_fim, status=Agendamento.STATUS_CONCLUIDO
        ).all()

        # Contadores separados por status preservam o contrato retornado ao frontend.
        agendamentos_total = DashboardService._base_query(data_inicio, data_fim).count()
        agendamentos_cancelados = DashboardService._base_query(
            data_inicio, data_fim, status=Agendamento.STATUS_CANCELADO
        ).count()
        agendamentos_pendentes = DashboardService._base_query(
            data_inicio, data_fim, status=Agendamento.STATUS_PENDENTE
        ).count()

        receita_total = sum(
            DashboardService._valor_agendamento(agendamento)
            for agendamento in agendamentos_concluidos
        )
        ticket_medio = (
            receita_total / len(agendamentos_concluidos)
            if agendamentos_concluidos
            else 0
        )

        return {
            "periodo_inicio": data_inicio.isoformat(),
            "periodo_fim": data_fim.isoformat(),
            "receita_total": round(float(receita_total), 2),
            "agendamentos_total": agendamentos_total,
            "agendamentos_concluidos": len(agendamentos_concluidos),
            "agendamentos_cancelados": agendamentos_cancelados,
            "agendamentos_pendentes": agendamentos_pendentes,
            "barbeiros_desempenho": DashboardService._get_barbeiros_desempenho(
                data_inicio, data_fim
            ),
            "top_5_horarios": DashboardService._get_horarios_populares(
                data_inicio, data_fim, top=5
            ),
            "receita_diaria": DashboardService._get_receita_diaria(
                data_inicio, data_fim
            ),
            "ticket_medio": round(float(ticket_medio), 2),
        }

    @staticmethod
    def get_dashboard_barbeiro(barbeiro_id, dias=30):
        # Mesmo recorte temporal do dashboard geral, aplicado ao barbeiro específico.
        data_inicio = DashboardService._period_start_from_days(dias)
        data_fim = datetime.now(timezone.utc)

        # Fail-fast para evitar consultas adicionais quando o recurso não existe.
        barbeiro = Barbeiro.query.get(barbeiro_id)
        if not barbeiro:
            return None

        # _to_desempenho_barbeiro encapsula receita, tempos e taxa de conclusão.
        agendamentos = DashboardService._base_query(
            data_inicio, data_fim, barbeiro_id=barbeiro_id
        ).all()
        kpis = DashboardService._to_desempenho_barbeiro(barbeiro, agendamentos)

        return {
            "barbeiro_id": kpis["barbeiro_id"],
            "barbeiro_nome": kpis["barbeiro_nome"],
            "periodo_inicio": data_inicio.isoformat(),
            "periodo_fim": data_fim.isoformat(),
            "receita_total": kpis["receita_total"],
            "agendamentos_concluidos": kpis["agendamentos_concluidos"],
            "agendamentos_cancelados": kpis["agendamentos_cancelados"],
            "servicos_realizados": kpis["servicos_realizados"],
            "top_5_horarios": DashboardService._get_horarios_populares(
                data_inicio, data_fim, barbeiro_id=barbeiro_id, top=5
            ),
            "taxa_conclusao": kpis["taxa_conclusao"],
        }

    @staticmethod
    def get_ganhos_totais(periodo="mes"):
        # Converte o rótulo funcional (dia/semana/mes) em data de corte UTC.
        data_inicio = DashboardService._period_start_from_label(periodo)

        agendamentos = (
            Agendamento.query.filter(
                Agendamento.status == Agendamento.STATUS_CONCLUIDO,
                Agendamento.data_agendamento >= data_inicio,
            ).all()
        )

        total = sum(DashboardService._valor_agendamento(agendamento) for agendamento in agendamentos)

        return round(float(total or 0), 2)

    @staticmethod
    def get_ganhos_barbeiros(periodo="mes"):
        data_inicio = DashboardService._period_start_from_label(periodo)

        agendamentos = (
            Agendamento.query.filter(
                Agendamento.status == Agendamento.STATUS_CONCLUIDO,
                Agendamento.data_agendamento >= data_inicio,
            ).all()
        )

        ganhos_map = {}
        for agendamento in agendamentos:
            barbeiro = agendamento.barbeiro
            if barbeiro.id not in ganhos_map:
                ganhos_map[barbeiro.id] = {
                    "barbeiro_id": barbeiro.id,
                    "barbeiro_nome": barbeiro.nome,
                    "total": 0.0,
                }
            ganhos_map[barbeiro.id]["total"] += float(
                DashboardService._valor_agendamento(agendamento)
            )

        ganhos = sorted(ganhos_map.values(), key=lambda item: item["total"], reverse=True)

        return [
            {
                "barbeiro_id": ganho["barbeiro_id"],
                "barbeiro_nome": ganho["barbeiro_nome"],
                "total": round(float(ganho["total"] or 0), 2),
            }
            for ganho in ganhos
        ]

    @staticmethod
    def get_atendimentos_gerais(inicio, fim):
        # Normaliza intervalo recebido pela rota para faixa UTC inclusiva.
        data_inicio, data_fim = DashboardService._parse_date_range(inicio, fim)

        return DashboardService._base_query(
            data_inicio, data_fim, status=Agendamento.STATUS_CONCLUIDO
        ).count()

    @staticmethod
    def get_atendimentos_barbeiros(inicio, fim):
        data_inicio, data_fim = DashboardService._parse_date_range(inicio, fim)

        # Agrupa por barbeiro no banco para retornar payload pronto para gráfico/tabela.
        resultados = (
            db.session.query(
                Barbeiro.id.label("barbeiro_id"),
                Barbeiro.nome.label("barbeiro_nome"),
                func.count(Agendamento.id).label("total_atendimentos"),
            )
            .join(Agendamento, Agendamento.barbeiro_id == Barbeiro.id)
            .filter(
                Agendamento.status == Agendamento.STATUS_CONCLUIDO,
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim,
            )
            .group_by(Barbeiro.id, Barbeiro.nome)
            .order_by(desc("total_atendimentos"))
            .all()
        )

        return [
            {
                "barbeiro_id": resultado.barbeiro_id,
                "barbeiro_nome": resultado.barbeiro_nome,
                "total_atendimentos": resultado.total_atendimentos,
            }
            for resultado in resultados
        ]

    @staticmethod
    def get_servico_mais_procurado():
        # first() sobre ranking DESC retorna somente o serviço líder no período global.
        resultado = (
            db.session.query(
                Servico.id.label("servico_id"),
                Servico.nome.label("nome"),
                func.count(AgendamentoServico.id).label("total"),
            )
            .join(AgendamentoServico, AgendamentoServico.servico_id == Servico.id)
            .join(Agendamento, Agendamento.id == AgendamentoServico.agendamento_id)
            .filter(
                Agendamento.status == Agendamento.STATUS_CONCLUIDO,
            )
            .group_by(Servico.id, Servico.nome)
            .order_by(desc("total"))
            .first()
        )

        if not resultado:
            return None

        return {
            "servico_id": resultado.servico_id,
            "nome": resultado.nome,
            "total": resultado.total,
        }

    @staticmethod
    def get_cliente_mais_atendimentos():
        # Mesmo padrão do serviço mais procurado, agora agregando por cliente.
        resultado = (
            db.session.query(
                Cliente.id.label("cliente_id"),
                Cliente.nome.label("nome"),
                func.count(Agendamento.id).label("total"),
            )
            .join(Agendamento, Agendamento.cliente_id == Cliente.id)
            .filter(
                Agendamento.status == Agendamento.STATUS_CONCLUIDO,
            )
            .group_by(Cliente.id, Cliente.nome)
            .order_by(desc("total"))
            .first()
        )

        if not resultado:
            return None

        return {
            "cliente_id": resultado.cliente_id,
            "nome": resultado.nome,
            "total": resultado.total,
        }

    @staticmethod
    def _base_query(data_inicio=None, data_fim=None, status=None, barbeiro_id=None):
        # Query Object: ponto único de composição de filtros sobre Agendamento.
        # Elimina os blocos .filter() duplicados em get_dashboard_geral,
        # get_dashboard_barbeiro, get_atendimentos_gerais e _get_barbeiros_desempenho.
        q = Agendamento.query
        if status is not None:
            q = q.filter(Agendamento.status == status)
        if data_inicio is not None:
            q = q.filter(Agendamento.data_agendamento >= data_inicio)
        if data_fim is not None:
            q = q.filter(Agendamento.data_agendamento <= data_fim)
        if barbeiro_id is not None:
            q = q.filter(Agendamento.barbeiro_id == barbeiro_id)
        return q

    @staticmethod
    def _to_desempenho_barbeiro(barbeiro, agendamentos):
        # Mapper: serializa KPIs de um barbeiro a partir da lista de agendamentos.
        # Compartilhado por get_dashboard_barbeiro e _get_barbeiros_desempenho
        # para evitar duplicação do cálculo de receita, tempo e taxa de conclusão.
        concluidos = [
            a for a in agendamentos if a.status == Agendamento.STATUS_CONCLUIDO
        ]
        cancelados = [
            a for a in agendamentos if a.status == Agendamento.STATUS_CANCELADO
        ]
        receita_total = sum(DashboardService._valor_agendamento(a) for a in concluidos)
        tempo_total = sum(
            DashboardService._duracao_total_agendamento(a) for a in concluidos
        )
        taxa_conclusao = (
            len(concluidos) / len(agendamentos) * 100 if agendamentos else 0
        )

        return {
            "barbeiro_id": barbeiro.id,
            "barbeiro_nome": barbeiro.nome,
            "total_agendamentos": len(agendamentos),
            "agendamentos_concluidos": len(concluidos),
            "agendamentos_cancelados": len(cancelados),
            "receita_total": round(float(receita_total), 2),
            "tempo_total_minutos": tempo_total,
            "servicos_realizados": DashboardService._formatar_servicos_realizados(
                concluidos
            ),
            "taxa_conclusao": round(float(taxa_conclusao), 2),
        }

    @staticmethod
    def _period_start_from_days(dias):
        # Helper central de tempo: evita divergência de timezone entre métodos.
        return datetime.now(timezone.utc) - timedelta(days=dias)

    @staticmethod
    def _period_start_from_label(periodo):
        dias_por_periodo = {"dia": 1, "semana": 7, "mes": 30}
        return DashboardService._period_start_from_days(
            dias_por_periodo.get(periodo, 30)
        )

    @staticmethod
    def _parse_date_range(inicio, fim):
        # Expande fim para 23:59:59.999999 UTC, garantindo filtro inclusivo por dia.
        data_inicio = datetime.strptime(inicio, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        data_fim = (
            datetime.strptime(fim, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            + timedelta(days=1)
            - timedelta(microseconds=1)
        )
        return data_inicio, data_fim

    @staticmethod
    def _formatar_servicos_realizados(agendamentos):
        # Normaliza saída de serviços: consolida duplicados com quantidade e receita acumulada.
        servicos = {}

        for agendamento in agendamentos:
            for servico in agendamento.servicos:
                nome = servico.nome
                if nome not in servicos:
                    servicos[nome] = {
                        "nome": nome,
                        "quantidade": 0,
                        "preco_unitario": float(servico.preco),
                        "receita": 0.0,
                    }

                servicos[nome]["quantidade"] += 1
                servicos[nome]["receita"] += float(servico.preco)

        return list(servicos.values())

    @staticmethod
    def _get_barbeiros_desempenho(data_inicio, data_fim):
        # Monta ranking detalhado por barbeiro mantendo o shape esperado pelo dashboard.
        barbeiros = Barbeiro.query.all()
        desempenho = []

        for barbeiro in barbeiros:
            agendamentos = DashboardService._base_query(
                data_inicio, data_fim, barbeiro_id=barbeiro.id
            ).all()

            if not agendamentos:
                continue

            desempenho.append(
                DashboardService._to_desempenho_barbeiro(barbeiro, agendamentos)
            )

        return sorted(desempenho, key=lambda item: item["receita_total"], reverse=True)

    @staticmethod
    def _get_horarios_populares(data_inicio, data_fim, barbeiro_id=None, top=5):
        # Agrupamento por hora no SQL evita loops de contagem no Python.
        query = db.session.query(
            func.strftime("%H:00", Agendamento.data_agendamento).label("hora"),
            func.count(Agendamento.id).label("total"),
        ).filter(
            Agendamento.status == Agendamento.STATUS_CONCLUIDO,
            Agendamento.data_agendamento >= data_inicio,
            Agendamento.data_agendamento <= data_fim,
        )

        if barbeiro_id is not None:
            query = query.filter(Agendamento.barbeiro_id == barbeiro_id)

        resultados = query.group_by("hora").order_by(desc("total")).limit(top).all()

        return [
            {"hora": resultado.hora, "total_agendamentos": resultado.total}
            for resultado in resultados
        ]

    @staticmethod
    def _get_receita_diaria(data_inicio, data_fim):
        # Receita (concluídos) e pendências são consolidadas por dia em duas agregações.
        concluidos = (
            Agendamento.query.filter(
                Agendamento.status == Agendamento.STATUS_CONCLUIDO,
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim,
            ).all()
        )

        pendentes_rows = (
            db.session.query(
                func.date(Agendamento.data_agendamento).label("data"),
                func.count(Agendamento.id).label("agendamentos_pendentes"),
            )
            .filter(
                Agendamento.status == Agendamento.STATUS_PENDENTE,
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim,
            )
            .group_by(func.date(Agendamento.data_agendamento))
            .all()
        )

        resultado = {}

        for agendamento in concluidos:
            chave = str(agendamento.data_agendamento.date())
            if chave not in resultado:
                resultado[chave] = {
                    "data": chave,
                    "receita": 0.0,
                    "agendamentos_concluidos": 0,
                    "agendamentos_pendentes": 0,
                }
            resultado[chave]["receita"] += float(
                DashboardService._valor_agendamento(agendamento)
            )
            resultado[chave]["agendamentos_concluidos"] += 1

        # Segunda passagem: injeta pendentes e cria dias sem receita, se necessário.
        for row in pendentes_rows:
            chave = str(row.data)
            if chave not in resultado:
                resultado[chave] = {
                    "data": chave,
                    "receita": 0.0,
                    "agendamentos_concluidos": 0,
                    "agendamentos_pendentes": 0,
                }
            resultado[chave]["agendamentos_pendentes"] = row.agendamentos_pendentes

        for chave in resultado:
            resultado[chave]["receita"] = round(resultado[chave]["receita"], 2)

        return [resultado[chave] for chave in sorted(resultado.keys())]
