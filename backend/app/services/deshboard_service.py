from datetime import datetime, timedelta, timezone
from sqlalchemy import and_
from app import db
from app.models.agendamento import Agendamento
from app.models.barbeiro import Barbeiro

#josue - 08/04/2026
# Service centralizado para lógica de negócios relacionada ao dashboard, como cálculos de receita, desempenho e análises de dados
# Ajustes de payload e receita diaria assinados por Josue Ferreira - 17/04/2026
class DashboardService:
    """Service centralizado para analytics e relatórios do dashboard"""

    @staticmethod
    def get_dashboard_geral(dias=30):
        """
        Retorna dashboard geral com métricas de receita, serviços e desempenho.

        Args:
            dias: períodos últimos X dias (default 30)

        Returns:
            dict com métricas aggregadas
        """
        data_inicio = datetime.now(timezone.utc) - timedelta(days=dias)
        data_fim = datetime.now(timezone.utc)

        # Total de agendamentos no período
        agendamentos_totais = Agendamento.query.filter(
            and_(
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim
            )
        ).all()

        # Contadores por status
        concluidos = [a for a in agendamentos_totais if a.status == Agendamento.STATUS_CONCLUIDO]
        cancelados = [a for a in agendamentos_totais if a.status == Agendamento.STATUS_CANCELADO]
        pendentes = [a for a in agendamentos_totais if a.status == Agendamento.STATUS_PENDENTE]

        # Receita total (apenas agendamentos concluídos)
        receita_total = sum(a.servico.preco for a in concluidos if a.servico)

        # Desempenho por barbeiro
        barbeiros = Barbeiro.query.all()
        barbeiros_desempenho = []

        for barbeiro in barbeiros:
            desempenho = DashboardService._calcular_desempenho_barbeiro(
                barbeiro.id, data_inicio, data_fim
            )
            if desempenho:
                barbeiros_desempenho.append(desempenho)

        # Top 5 horários
        top_horarios = DashboardService._get_horarios_populares(
            data_inicio, data_fim, top=5
        )

        # Receita diária
        receita_diaria = DashboardService._get_receita_diaria(data_inicio, data_fim)

        # Ticket médio
        ticket_medio = receita_total / len(concluidos) if concluidos else 0

        return {
            "periodo_inicio": data_inicio,
            "periodo_fim": data_fim,
            "receita_total": round(receita_total, 2),
            "agendamentos_total": len(agendamentos_totais),
            "agendamentos_concluidos": len(concluidos),
            "agendamentos_cancelados": len(cancelados),
            "agendamentos_pendentes": len(pendentes),
            "barbeiros_desempenho": barbeiros_desempenho,
            "top_5_horarios": top_horarios,
            "receita_diaria": receita_diaria,
            "ticket_medio": round(ticket_medio, 2),
        }

    @staticmethod
    def get_dashboard_barbeiro(barbeiro_id, dias=30):
        """
        Retorna dashboard específico de um barbeiro.

        Args:
            barbeiro_id: ID do barbeiro
            dias: períodos últimos X dias (default 30)

        Returns:
            dict com métricas do barbeiro ou None se barbeiro não encontrado
        """
        data_inicio = datetime.now(timezone.utc) - timedelta(days=dias)
        data_fim = datetime.now(timezone.utc)

        barbeiro = Barbeiro.query.get(barbeiro_id)
        if not barbeiro:
            return None

        agendamentos = Agendamento.query.filter(
            and_(
                Agendamento.barbeiro_id == barbeiro_id,
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim
            )
        ).all()

        concluidos = [a for a in agendamentos if a.status == Agendamento.STATUS_CONCLUIDO]
        cancelados = [a for a in agendamentos if a.status == Agendamento.STATUS_CANCELADO]

        receita_total = sum(a.servico.preco for a in concluidos if a.servico)

        # Serviços realizados
        servicos_dict = {}
        for agendamento in concluidos:
            if agendamento.servico:
                nome = agendamento.servico.nome
                if nome not in servicos_dict:
                    servicos_dict[nome] = {
                        "nome": nome,
                        "quantidade": 0,
                        "preco_unitario": agendamento.servico.preco,
                        "receita": 0
                    }
                servicos_dict[nome]["quantidade"] += 1
                servicos_dict[nome]["receita"] += agendamento.servico.preco

        horarios = DashboardService._get_horarios_populares(
            data_inicio, data_fim, barbeiro_id=barbeiro_id, top=5
        )
        taxa_conclusao = (len(concluidos) / len(agendamentos) * 100) if agendamentos else 0

        return {
            "barbeiro_id": barbeiro_id,
            "barbeiro_nome": barbeiro.nome,
            "periodo_inicio": data_inicio,
            "periodo_fim": data_fim,
            "receita_total": round(receita_total, 2),
            "agendamentos_concluidos": len(concluidos),
            "agendamentos_cancelados": len(cancelados),
            "servicos_realizados": list(servicos_dict.values()),
            "top_5_horarios": horarios,
            "taxa_conclusao": round(taxa_conclusao, 2),
        }

    @staticmethod
    def _calcular_desempenho_barbeiro(barbeiro_id, data_inicio, data_fim):
        """Calcula desempenho de um barbeiro no período"""
        agendamentos = Agendamento.query.filter(
            and_(
                Agendamento.barbeiro_id == barbeiro_id,
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim
            )
        ).all()

        if not agendamentos:
            return None

        barbeiro = Barbeiro.query.get(barbeiro_id)
        concluidos = [a for a in agendamentos if a.status == Agendamento.STATUS_CONCLUIDO]
        cancelados = [a for a in agendamentos if a.status == Agendamento.STATUS_CANCELADO]

        receita_total = sum(a.servico.preco for a in concluidos if a.servico)
        tempo_total = sum(a.servico.duracao_minutos for a in concluidos if a.servico)

        # Contar serviços por tipo
        servicos_dict = {}
        for agendamento in concluidos:
            if agendamento.servico:
                nome_servico = agendamento.servico.nome
                if nome_servico not in servicos_dict:
                    servicos_dict[nome_servico] = {
                        "nome": nome_servico,
                        "quantidade": 0,
                        "preco_unitario": agendamento.servico.preco,
                        "receita": 0
                    }
                servicos_dict[nome_servico]["quantidade"] += 1
                servicos_dict[nome_servico]["receita"] += agendamento.servico.preco

        taxa_conclusao = (len(concluidos) / len(agendamentos) * 100) if agendamentos else 0

        return {
            "barbeiro_id": barbeiro_id,
            "barbeiro_nome": barbeiro.nome if barbeiro else "N/A",
            "total_agendamentos": len(agendamentos),
            "agendamentos_concluidos": len(concluidos),
            "agendamentos_cancelados": len(cancelados),
            "receita_total": round(receita_total, 2),
            "tempo_total_minutos": tempo_total,
            "servicos_realizados": list(servicos_dict.values()),
            "taxa_conclusao": round(taxa_conclusao, 2),
        }

    @staticmethod
    def _get_horarios_populares(data_inicio, data_fim, barbeiro_id=None, top=5):
        """Retorna top X horários mais agendados"""
        query = Agendamento.query.filter(
            and_(
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim,
                Agendamento.status == Agendamento.STATUS_CONCLUIDO
            )
        )

        if barbeiro_id:
            query = query.filter(Agendamento.barbeiro_id == barbeiro_id)

        agendamentos = query.all()

        horas_count = {}
        for agendamento in agendamentos:
            hora = agendamento.data_agendamento.hour
            horas_count[hora] = horas_count.get(hora, 0) + 1

        # Ordenar e pegar top
        top_horas = sorted(horas_count.items(), key=lambda x: x[1], reverse=True)[:top]

        return [
            {"hora": hora, "total_agendamentos": count}
            for hora, count in top_horas
        ]

    @staticmethod
    def _get_receita_diaria(data_inicio, data_fim):
        """Retorna receita agrupada por dia"""
        agendamentos_concluidos = Agendamento.query.filter(
            and_(
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim,
                Agendamento.status == Agendamento.STATUS_CONCLUIDO
            )
        ).all()

        receita_por_dia = {}
        agendamentos_por_dia = {}

        for agendamento in agendamentos_concluidos:
            data_str = agendamento.data_agendamento.strftime("%Y-%m-%d")

            if data_str not in receita_por_dia:
                receita_por_dia[data_str] = 0
                agendamentos_por_dia[data_str] = {"concluidos": 0, "pendentes": 0}

            receita_por_dia[data_str] += agendamento.servico.preco if agendamento.servico else 0
            agendamentos_por_dia[data_str]["concluidos"] += 1

        # Contar pendentes por dia
        agendamentos_pendentes = Agendamento.query.filter(
            and_(
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim,
                Agendamento.status == Agendamento.STATUS_PENDENTE
            )
        ).all()

        for agendamento in agendamentos_pendentes:
            data_str = agendamento.data_agendamento.strftime("%Y-%m-%d")
            if data_str not in agendamentos_por_dia:
                agendamentos_por_dia[data_str] = {"concluidos": 0, "pendentes": 0}
            agendamentos_por_dia[data_str]["pendentes"] += 1

        resultado = []
        for data in sorted(agendamentos_por_dia.keys()):
            resultado.append({
                "data": data,
                "receita": round(receita_por_dia.get(data, 0), 2),
                "agendamentos_concluidos": agendamentos_por_dia[data]["concluidos"],
                "agendamentos_pendentes": agendamentos_por_dia[data].get("pendentes", 0)
            })

        return resultado
    

