"""
Contrato de dados do módulo de dashboard.

Este arquivo define exclusivamente os schemas de saída consumidos pelas rotas
de dashboard. A camada de service deve serializar os KPIs exatamente neste
formato para manter compatibilidade com o frontend.

Regra de manutenção: qualquer alteração em campos/tipos aqui deve ser tratada
como mudança de contrato da API (impacta integração e testes de rota).
"""

# JOSUE - 16/04/2026

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class ServicoRealizadoSchema(BaseModel):
    nome: str
    quantidade: int
    preco_unitario: float
    receita: float


class HorarioPopularSchema(BaseModel):
    hora: str
    total_agendamentos: int


class ReceitaPeriodicaSchema(BaseModel):
    data: str
    receita: float
    agendamentos_concluidos: int
    agendamentos_pendentes: int = 0


class BarbeiroDesempenhoSchema(BaseModel):
    barbeiro_id: int
    barbeiro_nome: str
    total_agendamentos: int
    agendamentos_concluidos: int
    agendamentos_cancelados: int
    receita_total: float
    tempo_total_minutos: int
    servicos_realizados: List[ServicoRealizadoSchema] = Field(default_factory=list)
    taxa_conclusao: float


class DashboardResumoSchema(BaseModel):
    periodo_inicio: datetime
    periodo_fim: datetime
    receita_total: float
    agendamentos_total: int
    agendamentos_concluidos: int
    agendamentos_cancelados: int
    agendamentos_pendentes: int

    barbeiros_desempenho: List[BarbeiroDesempenhoSchema] = Field(default_factory=list)
    top_5_horarios: List[HorarioPopularSchema] = Field(default_factory=list)
    receita_diaria: List[ReceitaPeriodicaSchema] = Field(default_factory=list)
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
    servicos_realizados: List[ServicoRealizadoSchema] = Field(default_factory=list)
    top_5_horarios: List[HorarioPopularSchema] = Field(default_factory=list)
    taxa_conclusao: float
