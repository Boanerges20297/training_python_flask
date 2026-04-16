from pydantic import BaseModel,Field
from typing import List,Dict
from datetime import datetime
# josue - 08/04/2026
# Schemas específicos para o dashboard, focados em relatórios e análises de dados
class ServicoResumoSchema(BaseModel):
    """Serviço simplificado para agregações"""
    id: int
    nome: str
    preco:float
    duracao_minutos:int

class HorarioPopularSchema(BaseModel):
    """Horário do dia + quantidade de agendamentos"""
    hora:int
    total_agendamentos:int

class ReceitaPeriodicaSchema(BaseModel):
    """Receita agrupada por dia"""
    data:str
    receita:float
    agendamentos_concluidos:int

class BarbeiroDesempenhoSchema(BaseModel):
    """Performance de um barbeiro em um período"""
    barbeiro_id:int
    barbeiro_nome:str
    agendamentos_concluidos:int
    agendamentos_cancelados:int
    receita_total:float
    total_agendamentos:int
    tempo_total_minutos:int
    servicos_realizados:List[Dict] = Field(default_factory=list)
    taxa_conclusao:float


class DashboardResumoSchema(BaseModel):
    """Dashboard geral: todos os barbeiros agregados"""
    periodo_inicio: datetime
    periodo_fim: datetime
    receita_total: float
    agendamentos_total: int
    agendamentos_concluidos: int
    agendamentos_cancelados: int
    barbeiros_desempenho: List[BarbeiroDesempenhoSchema]
    top_5_horarios: List[HorarioPopularSchema]
    receita_diaria: List[ReceitaPeriodicaSchema]
    ticket_medio: float


class DashboardBarbeiroSchema(BaseModel):
    """Dashboard individual: um barbeiro específico"""
    barbeiro_id: int
    barbeiro_nome: str
    periodo_inicio: datetime
    periodo_fim: datetime
    receita_total: float
    agendamentos_concluidos: int
    agendamentos_cancelados: int
    servicos_realizados: List[Dict]
    taxa_conclusao: float