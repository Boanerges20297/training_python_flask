import React from 'react';
import type { Agendamento, Cliente, Servico } from '../../../types';
import { Calendar, Users, Clock, CheckCircle, XCircle, UserCheck, Settings } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import { updateAgendamento } from '../../../api/appointments';

interface BarberAgendaDiaProps {
  agendamentos: Agendamento[];
  clienteMap: Record<number, Cliente>;
  servicoMap: Record<number, Servico>;
  loading: boolean;
  onRefresh: () => void;
  onOpenStatusModal: (a: Agendamento) => void;
}

const BarberAgendaDia: React.FC<BarberAgendaDiaProps> = ({
  agendamentos,
  clienteMap,
  servicoMap,
  loading,
  onRefresh,
  onOpenStatusModal,
}) => {
  // Filtra apenas agendamentos de hoje
  const today = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos.filter((a) => {
    const agendDate = a.data_agendamento?.split('T')[0];
    return agendDate === today;
  });

  // Métricas do dia
  const totalHoje = agendamentosHoje.length;
  const pendentes = agendamentosHoje.filter((a) => (a.status || 'pendente') === 'pendente').length;
  const concluidos = agendamentosHoje.filter((a) => a.status === 'concluido').length;

  // Próximo cliente
  const nextClient = agendamentosHoje
    .filter((a) => a.status !== 'concluido' && a.status !== 'cancelado')
    .sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime())[0];

  // Ação rápida de status
  const handleQuickAction = async (agendamento: Agendamento, newStatus: string) => {
    try {
      await updateAgendamento(agendamento.id, { status: newStatus });
      onRefresh();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  // Renderiza botões de ação contextual baseado no status atual
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
          <Button variant="ghost" theme="slate" size="sm" icon={<XCircle size={14} />}
            onClick={() => handleQuickAction(a, 'cancelado')}>Não Compareceu</Button>
        </div>
      );
    }
    // Concluido / Cancelado → apenas gerenciar
    return (
      <Button variant="ghost" theme="amber" size="sm" icon={<Settings size={14} />}
        onClick={() => onOpenStatusModal(a)}>Gerenciar</Button>
    );
  };

  const columns: Column<Agendamento>[] = [
    {
      header: 'Cliente',
      render: (a) => <span className="text-capitalize">{clienteMap[a.cliente_id]?.nome || 'Desconhecido'}</span>,
    },
    {
      header: 'Serviço',
      render: (a) => <span className="text-capitalize">{servicoMap[a.servicos_ids[0]]?.nome || 'Serviço'}</span>,
    },
    {
      header: 'Horário',
      render: (a) => (
        <span>
          {new Date(a.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
      {/* Métricas do Dia */}
      <div className="barber-metrics">
        <div className="barber-metric-card">
          <div className="metric-icon"><Calendar size={24} /></div>
          <div className="metric-info">
            <h4>Agenda Hoje</h4>
            <div className="metric-value">{totalHoje}</div>
          </div>
        </div>
        <div className="barber-metric-card">
          <div className="metric-icon"><Clock size={24} /></div>
          <div className="metric-info">
            <h4>Pendentes</h4>
            <div className="metric-value">{pendentes}</div>
          </div>
        </div>
        <div className="barber-metric-card">
          <div className="metric-icon"><CheckCircle size={24} /></div>
          <div className="metric-info">
            <h4>Concluídos</h4>
            <div className="metric-value">{concluidos}</div>
          </div>
        </div>
      </div>

      {/* Card Próximo Cliente */}
      {nextClient && (
        <div className="barber-highlight-card">
          <div className="barber-highlight-icon"><Users size={28} color="#f59e0b" /></div>
          <div className="barber-highlight-info">
            <h3>Próximo Cliente</h3>
            <p className="text-capitalize">
              {clienteMap[nextClient.cliente_id]?.nome} • {servicoMap[nextClient.servicos_ids[0]]?.nome}
            </p>
            <p className="highlight-detail">
              {new Date(nextClient.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button theme="amber" size="sm" onClick={() => handleQuickAction(nextClient, 'confirmado')}>
            Confirmar
          </Button>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        title="Agenda do Dia"
        icon={Calendar}
        data={agendamentosHoje}
        columns={columns}
        loading={loading}
        themeColor="#f59e0b"
        emptyStateIcon={Calendar}
        emptyStateText="Nenhum agendamento para hoje. Aproveite o descanso!"
      />
    </>
  );
};

export default BarberAgendaDia;
