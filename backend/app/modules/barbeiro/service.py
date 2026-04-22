from datetime import datetime, timedelta, timezone

from sqlalchemy import desc

from app import db
from app.modules.agendamento.model import Agendamento
from app.modules.barbeiro.model import Barbeiro


class BarbeiroService:
    @staticmethod
    def _formatar_servicos_realizados(agendamentos):
        # Normaliza saída de serviços: consolida duplicados com quantidade e receita acumulada.
        # Vinicius - 21/04/2026: adaptado para M2M (agendamento.servicos é uma lista)
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
    def _to_desempenho_barbeiro(barbeiro, agendamentos):
        concluidos = [
            a for a in agendamentos if a.status == Agendamento.STATUS_CONCLUIDO
        ]
        cancelados = [
            a for a in agendamentos if a.status == Agendamento.STATUS_CANCELADO
        ]
        receita_total = sum(a.servico.preco for a in concluidos if a.servico)
        tempo_total = sum(a.servico.duracao_minutos for a in concluidos if a.servico)
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
            "servicos_realizados": BarbeiroService._formatar_servicos_realizados(
                concluidos
            ),
            "taxa_conclusao": round(float(taxa_conclusao), 2),
        }

    @staticmethod
    def obter_ranking_desempenho(dias=30):
        # Helper central de tempo: evita divergência de timezone.
        data_inicio = datetime.now(timezone.utc) - timedelta(days=dias)
        data_fim = datetime.now(timezone.utc)

        barbeiros = Barbeiro.query.all()
        desempenho = []

        for barbeiro in barbeiros:
            agendamentos = Agendamento.query.filter(
                Agendamento.barbeiro_id == barbeiro.id,
                Agendamento.data_agendamento >= data_inicio,
                Agendamento.data_agendamento <= data_fim,
            ).all()

            if not agendamentos:
                continue

            desempenho.append(
                BarbeiroService._to_desempenho_barbeiro(barbeiro, agendamentos)
            )

        return sorted(desempenho, key=lambda item: item["receita_total"], reverse=True)
