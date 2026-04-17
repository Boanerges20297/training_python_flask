import React from 'react';
import type { Agendamento, Servico, Barbeiro } from '../../../types';
import { Calendar, Clock, CalendarPlus, CalendarCheck } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface ClientInicioProps {
  agendamentos: Agendamento[];
  servicoMap: Record<number, Servico>;
  barbeiroMap: Record<number, Barbeiro>;
  onOpenBooking: () => void;
}

const ClientInicio: React.FC<ClientInicioProps> = ({
  agendamentos,
  servicoMap,
  barbeiroMap,
  onOpenBooking,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Próximo agendamento futuro não-cancelado/concluído
  const proximoAgendamento = agendamentos
    .filter((a) => {
      const status = a.status || 'pendente';
      return status !== 'cancelado' && status !== 'concluido';
    })
    .sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime())
    .find((a) => new Date(a.data_agendamento) >= new Date());

  // Métricas rápidas
  const totalAgendamentos = agendamentos.length;
  const agendamentosPendentes = agendamentos.filter((a) => (a.status || 'pendente') === 'pendente').length;

  return (
    <>
      {/* Botão de novo agendamento */}
      <div className="client-welcome">
        <div>
          <p>Agende um novo serviço ou acompanhe seus horários marcados.</p>
        </div>
        <Button theme="blue" size="md" icon={<CalendarPlus size={18} />} onClick={onOpenBooking}>
          Novo Agendamento
        </Button>
      </div>

      {/* Card Destaque */}
      {proximoAgendamento ? (
        <div className="client-highlight-card">
          <div className="client-highlight-icon">
            <CalendarCheck size={28} color="#3b82f6" />
          </div>
          <div className="client-highlight-info">
            <h3>Próximo Agendamento</h3>
            <p className="text-capitalize">
              {servicoMap[proximoAgendamento.servico_id]?.nome || 'Serviço'} com{' '}
              {barbeiroMap[proximoAgendamento.barbeiro_id]?.nome || 'Profissional'}
            </p>
            <div className="highlight-detail">
              <Calendar size={13} />
              {formatDate(proximoAgendamento.data_agendamento)}
              {servicoMap[proximoAgendamento.servico_id] && (
                <>
                  <span>•</span>
                  <Clock size={13} />
                  {servicoMap[proximoAgendamento.servico_id].duracao_minutos} min
                </>
              )}
            </div>
          </div>
          <span className={`status-pill ${proximoAgendamento.status || 'pendente'}`}>
            {proximoAgendamento.status || 'pendente'}
          </span>
        </div>
      ) : (
        <div className="client-highlight-card">
          <div className="client-highlight-icon">
            <CalendarPlus size={28} color="#3b82f6" />
          </div>
          <div className="client-highlight-info">
            <h3>Nenhum agendamento ativo</h3>
            <p>Clique em "Novo Agendamento" para marcar seu horário!</p>
          </div>
        </div>
      )}

      {/* Métricas */}
      <div className="client-metrics">
        <div className="client-metric-card">
          <div className="metric-icon blue"><Calendar size={22} /></div>
          <div className="metric-info">
            <h4>Total de Agendamentos</h4>
            <div className="metric-value">{totalAgendamentos}</div>
          </div>
        </div>
        <div className="client-metric-card">
          <div className="metric-icon blue"><Clock size={22} /></div>
          <div className="metric-info">
            <h4>Pendentes</h4>
            <div className="metric-value">{agendamentosPendentes}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientInicio;
