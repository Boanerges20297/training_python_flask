from app.models.agendamento import Agendamento
from app.models.servico import Servico
from app.models.barbeiro import Barbeiro
from app.models.cliente import Cliente
from app import db
from sqlalchemy import func, desc
from datetime import datetime, timedelta

class DashboardService:
    """
    Serviço responsável por calcular métricas e estatísticas para os Dashboards.
    Implementa a Fase 5 do projeto de integração.
    """

    @staticmethod
    def get_dashboard_geral(dias=30):
        data_limite = datetime.utcnow() - timedelta(days=dias)
        
        # 1. Agendamentos Concluídos no período
        agendamentos_concluidos = Agendamento.query.filter(
            Agendamento.status == Agendamento.STATUS_CONCLUIDO,
            Agendamento.data_agendamento >= data_limite
        ).all()

        total_atendimentos = len(agendamentos_concluidos)
        faturamento_total = sum(agendamento.servico.preco for agendamento in agendamentos_concluidos if agendamento.servico)
        
        # 2. Taxa de cancelamento
        total_periodo = Agendamento.query.filter(Agendamento.data_agendamento >= data_limite).count()
        cancelados = Agendamento.query.filter(
            Agendamento.status == Agendamento.STATUS_CANCELADO,
            Agendamento.data_agendamento >= data_limite
        ).count()
        taxa_cancelamento = (cancelados / total_periodo * 100) if total_periodo > 0 else 0

        # 3. Ticket Médio
        ticket_medio = (faturamento_total / total_atendimentos) if total_atendimentos > 0 else 0

        # 4. Receita Diária (Série temporal para o gráfico)
        receita_diaria = db.session.query(
            func.date(Agendamento.data_agendamento).label('data'),
            func.sum(Servico.preco).label('valor')
        ).join(Servico).filter(
            Agendamento.status == Agendamento.STATUS_CONCLUIDO,
            Agendamento.data_agendamento >= data_limite
        ).group_by(func.date(Agendamento.data_agendamento)).all()

        format_receita = [{"data": str(r.data), "valor": float(r.valor)} for r in receita_diaria]

        # 5. Top 5 Horários
        horarios = db.session.query(
            func.strftime('%H:00', Agendamento.data_agendamento).label('hora'),
            func.count(Agendamento.id).label('total')
        ).filter(
            Agendamento.status == Agendamento.STATUS_CONCLUIDO,
            Agendamento.data_agendamento >= data_limite
        ).group_by('hora').order_by(desc('total')).limit(5).all()

        # 6. Desempenho dos Barbeiros (Ranking)
        barbeiros = Barbeiro.query.all()
        barbeiros_desempenho = []
        for b in barbeiros:
            # Agendamentos do barbeiro no período
            b_concluidos = Agendamento.query.filter(
                Agendamento.barbeiro_id == b.id,
                Agendamento.status == Agendamento.STATUS_CONCLUIDO,
                Agendamento.data_agendamento >= data_limite
            ).all()
            
            b_total = Agendamento.query.filter(
                Agendamento.barbeiro_id == b.id,
                Agendamento.data_agendamento >= data_limite
            ).count()
            
            b_cancelados = Agendamento.query.filter(
                Agendamento.barbeiro_id == b.id,
                Agendamento.status == Agendamento.STATUS_CANCELADO,
                Agendamento.data_agendamento >= data_limite
            ).count()
            
            b_receita = sum(a.servico.preco for a in b_concluidos if a.servico)
            
            # Serviços realizados por este barbeiro
            srv_counts = {}
            for a in b_concluidos:
                if a.servico:
                    srv_counts[a.servico.nome] = srv_counts.get(a.servico.nome, {"quantidade": 0, "receita": 0})
                    srv_counts[a.servico.nome]["quantidade"] += 1
                    srv_counts[a.servico.nome]["receita"] += float(a.servico.preco)
            
            servicos_formatados = [{"nome": k, "quantidade": v["quantidade"], "receita": v["receita"]} for k, v in srv_counts.items()]

            barbeiros_desempenho.append({
                "barbeiro_id": b.id,
                "barbeiro_nome": b.nome,
                "agendamentos_concluidos": len(b_concluidos),
                "agendamentos_cancelados": b_cancelados,
                "receita_total": float(b_receita),
                "taxa_conclusao": round((len(b_concluidos) / b_total * 100), 2) if b_total > 0 else 0,
                "tempo_total_minutos": sum(a.servico.duracao_minutos for a in b_concluidos if a.servico),
                "servicos_realizados": servicos_formatados
            })

        return {
            "receita_total": float(faturamento_total),
            "agendamentos_concluidos": total_atendimentos,
            "agendamentos_total": total_periodo,
            "agendamentos_cancelados": cancelados,
            "ticket_medio": float(ticket_medio),
            "taxa_cancelamento": round(taxa_cancelamento, 2),
            "receita_diaria": format_receita,
            "top_5_horarios": [{"hora": h.hora, "total_agendamentos": h.total} for h in horarios],
            "barbeiros_desempenho": sorted(barbeiros_desempenho, key=lambda x: x["receita_total"], reverse=True)
        }

    @staticmethod
    def get_dashboard_barbeiro(barbeiro_id, dias=30):
        data_limite = datetime.utcnow() - timedelta(days=dias)
        
        barbeiro = Barbeiro.query.get(barbeiro_id)
        if not barbeiro:
            return None

        # Métricas individuais
        concluidos = Agendamento.query.filter(
            Agendamento.barbeiro_id == barbeiro_id,
            Agendamento.status == Agendamento.STATUS_CONCLUIDO,
            Agendamento.data_agendamento >= data_limite
        ).all()

        faturamento = sum(a.servico.preco for a in concluidos if a.servico)
        atendimentos = len(concluidos)

        # Próximos agendamentos (Agenda do dia/semana)
        proximos = Agendamento.query.filter(
            Agendamento.barbeiro_id == barbeiro_id,
            Agendamento.status == Agendamento.STATUS_CONFIRMADO,
            Agendamento.data_agendamento >= datetime.utcnow()
        ).order_by(Agendamento.data_agendamento).limit(5).all()

        return {
            "barbeiro_nome": barbeiro.nome,
            "metricas": {
                "faturamento": float(faturamento),
                "atendimentos": atendimentos
            },
            "proximos_agendamentos": [
                {
                    "id": a.id,
                    "data": a.data_agendamento.isoformat(),
                    "cliente": a.cliente.nome,
                    "servico": a.servico.nome
                } for a in proximos
            ]
        }

    @staticmethod
    def get_ganhos_totais(periodo='mes'):
        # Lógica simplificada para ganhos
        agendamentos = Agendamento.query.filter_by(status=Agendamento.STATUS_CONCLUIDO).all()
        return float(sum(a.servico.preco for a in agendamentos if a.servico))

    @staticmethod
    def get_ganhos_barbeiros(periodo='mes'):
        ganhos = db.session.query(
            Barbeiro.nome,
            func.sum(Servico.preco).label('total')
        ).join(Agendamento, Agendamento.barbeiro_id == Barbeiro.id)\
         .join(Servico, Agendamento.servico_id == Servico.id)\
         .filter(Agendamento.status == Agendamento.STATUS_CONCLUIDO)\
         .group_by(Barbeiro.nome).all()
        
        return [{"barbeiro": g.nome, "total": float(g.total)} for g in ganhos]

    @staticmethod
    def get_atendimentos_gerais(inicio, fim):
        return Agendamento.query.filter(
            Agendamento.data_agendamento.between(inicio, fim),
            Agendamento.status == Agendamento.STATUS_CONCLUIDO
        ).count()

    @staticmethod
    def get_servico_mais_procurado():
        res = db.session.query(
            Servico.nome,
            func.count(Agendamento.id).label('total')
        ).join(Agendamento).group_by(Servico.nome).order_by(desc('total')).first()
        return {"nome": res.nome, "total": res.total} if res else None

    @staticmethod
    def get_cliente_mais_atendimentos():
        res = db.session.query(
            Cliente.nome,
            func.count(Agendamento.id).label('total')
        ).join(Agendamento).group_by(Cliente.nome).order_by(desc('total')).first()
        return {"nome": res.nome, "total": res.total} if res else None
