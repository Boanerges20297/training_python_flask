import React, { useState } from 'react';
import type { Agendamento, Cliente, Servico } from '../../../types';
import { History, TrendingUp, CheckCircle, XCircle, UserCheck, Settings } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { updateAgendamento } from '../../../api/appointments';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import Input from '../../../components/ui/Input';

interface BarberHistoricoProps {
  agendamentos: Agendamento[];
  clienteMap: Record<number, Cliente>;
  servicoMap: Record<number, Servico>;
  loading: boolean;
  onRefresh: () => void;
  onOpenStatusModal: (a: Agendamento) => void;
}

const BarberHistorico: React.FC<BarberHistoricoProps> = ({
  agendamentos,
  clienteMap,
  servicoMap,
  loading,
  onRefresh,
  onOpenStatusModal,
}) => {
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Ação rápida de status (Copied from AgendaDia for consistency)
  const handleQuickAction = async (agendamento: Agendamento, newStatus: string) => {
    try {
      await updateAgendamento(agendamento.id, { status: newStatus });
      onRefresh();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const renderActions = (a: Agendamento) => {
    const status = a.status || 'pendente';

    if (status === 'pendente') {
      return (
        <div className="action-btn-group">
          <Button variant="ghost" theme="green" size="sm" icon={<CheckCircle size={14} />}
            onClick={() => handleQuickAction(a, 'confirmado')}>Confirmar</Button>
          <Button variant="ghost" theme="slate" size="sm" icon={<XCircle size={14} />}
            onClick={() => handleQuickAction(a, 'cancelado')}>Cancelar</Button>
        </div>
      );
    }
    if (status === 'confirmado') {
      return (
        <div className="action-btn-group">
          <Button variant="ghost" theme="green" size="sm" icon={<UserCheck size={14} />}
            onClick={() => handleQuickAction(a, 'concluido')}>Concluir</Button>
        </div>
      );
    }
    return (
      <Button variant="ghost" theme="amber" size="sm" icon={<Settings size={14} />}
        onClick={() => onOpenStatusModal(a)}>Gerenciar</Button>
    );
  };

  // Filtra por status
  const filtered = agendamentos.filter((a) => {
    if (filtroStatus === 'todos') return true;
    return (a.status || 'pendente') === filtroStatus;
  });

  // Métricas agregadas
  const totalAtendimentos = agendamentos.filter((a) => a.status === 'concluido').length;
  const taxaConclusao = agendamentos.length > 0
    ? Math.round((totalAtendimentos / agendamentos.length) * 100)
    : 0;

  const columns: Column<Agendamento>[] = [
    {
      header: 'Cliente',
      render: (a) => <span className="text-capitalize">{clienteMap[a.cliente_id]?.nome || '#' + a.cliente_id}</span>,
    },
    {
      header: 'Serviço',
      render: (a) => <span className="text-capitalize">{servicoMap[a.servicos_ids[0]]?.nome || '#' + a.servicos_ids[0]}</span>,
    },
    {
      header: 'Data',
      render: (a) => (
        <span>
          {new Date(a.data_agendamento).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      ),
      align: 'center',
    },
      {
        header: 'Status',
        render: (a) => <span className={`status-pill ${a.status || 'pendente'}`}>{a.status || 'pendente'}</span>,
        align: 'center',
      },
      {
        header: 'Ações',
        render: renderActions,
        align: 'center',
      },
    ];

  return (
    <>
      {/* Métricas */}
      <div className="barber-metrics">
        <div className="barber-metric-card">
          <div className="metric-icon"><History size={24} /></div>
          <div className="metric-info">
            <h4>Total Atendidos</h4>
            <div className="metric-value">{totalAtendimentos}</div>
          </div>
        </div>
        <div className="barber-metric-card">
          <div className="metric-icon"><TrendingUp size={24} /></div>
          <div className="metric-info">
            <h4>Taxa de Conclusão</h4>
            <div className="metric-value">{taxaConclusao}%</div>
          </div>
        </div>
      </div>

      {/* Filtro */}
      <div className="historico-filters">
        <div className="filter-group">
          <Input
            as="select"
            label="Filtrar por Status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </Input>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        title="Histórico de Atendimentos"
        icon={History}
        data={filtered}
        columns={columns}
        loading={loading}
        themeColor="#f59e0b"
        emptyStateIcon={History}
        emptyStateText="Nenhum atendimento encontrado com os filtros atuais."
      />
    </>
  );
};

export default BarberHistorico;
