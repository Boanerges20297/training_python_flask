from app.modules.agendamento.model import Agendamento
# Josue - 21/04/2026: este repositório é um exemplo de camada de abstração para consultas complexas de agendamento.
# Ele pode ser expandido para incluir métodos específicos de consulta, como buscar agendamentos por
class AgendamentoRepository:
    @staticmethod
    def buscar_por_filtros(filtros, order_by=None):
        query = Agendamento.query.filter(*filtros)
        if order_by:
            query = query.order_by(order_by)
        return query
