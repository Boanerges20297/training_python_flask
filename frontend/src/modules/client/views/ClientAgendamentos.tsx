import React, { useState } from 'react';
import type { Agendamento, Servico, Barbeiro } from '../../../types';
import { Calendar, XCircle } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { updateAgendamento } from '../../../api/appointments';

interface ClientAgendamentosProps {
  agendamentos: Agendamento[];
  servicoMap: Record<number, Servico>;
  barbeiroMap: Record<number, Barbeiro>;
  loading: boolean;
  onRefresh: () => void;
}

const ClientAgendamentos: React.FC<ClientAgendamentosProps> = ({ agendamentos, servicoMap, barbeiroMap, loading, onRefresh }) => {
  const [cancelTarget, setCancelTarget] = useState<Agendamento | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const handleCancelClick = (agendamento: Agendamento) => {
    const horasRestantes = (new Date(agendamento.data_agendamento).getTime() - Date.now()) / (1000 * 60 * 60);
    if (horasRestantes < 2) {
      setErrorMsg('Não é possível cancelar com menos de 2 horas de antecedência.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    setCancelTarget(agendamento);
    setShowConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      await updateAgendamento(cancelTarget.id, { status: 'cancelado' });
      onRefresh();
      
      // # Gabriel (Dev 1) - Dispara notificação global
      const event = new CustomEvent('barbabyte:notificacao', {
        detail: {
          title: 'Agendamento Cancelado',
          message: `Um agendamento do serviço #${cancelTarget.servico_id} foi cancelado pelo cliente #${cancelTarget.cliente_id}.`,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'cancel'
        }
      });
      window.dispatchEvent(event);
      
    } catch (err) { console.error(err); }
    finally { setShowConfirm(false); setCancelTarget(null); }
  };

  const columns: Column<Agendamento>[] = [
    { header: 'Serviço', render: (a) => <span className="text-capitalize">{servicoMap[a.servico_id]?.nome || '#' + a.servico_id}</span> },
    { header: 'Profissional', render: (a) => <span className="text-capitalize">{barbeiroMap[a.barbeiro_id]?.nome || '#' + a.barbeiro_id}</span>, align: 'center' },
    { header: 'Data', render: (a) => <span>{formatDate(a.data_agendamento)}</span>, align: 'center' },
    { header: 'Status', render: (a) => <span className={`status-pill ${a.status || 'pendente'}`}>{a.status || 'pendente'}</span>, align: 'center' },
    {
      header: 'Ações',
      render: (a) => (a.status === 'pendente' || a.status === 'confirmado') ? (
        <Button variant="ghost" theme="slate" size="sm" icon={<XCircle size={14} />} onClick={() => handleCancelClick(a)}>Cancelar</Button>
      ) : <span className="text-muted">—</span>,
      align: 'center',
    },
  ];

  return (
    <>
      {errorMsg && <div className="cancel-error-banner"><XCircle size={16} /><span>{errorMsg}</span></div>}
      <DataTable 
        title="Meus Agendamentos" 
        icon={Calendar} 
        data={agendamentos} 
        columns={columns} 
        loading={loading} 
        themeColor="#3b82f6" 
        buttonTheme="blue" 
        emptyStateIcon={Calendar} 
        emptyStateText="Você ainda não possui agendamentos." 
        enableSearch={true}
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          const bName = barbeiroMap[item.barbeiro_id]?.nome || '';
          const sName = servicoMap[item.servico_id]?.nome || '';
          return (
            bName.toLowerCase().includes(q) ||
            sName.toLowerCase().includes(q) ||
            String(item.id).includes(q)
          );
        }}
      />
      <ConfirmDialog isOpen={showConfirm} title="Cancelar Agendamento" message="Tem certeza que deseja cancelar? Esta ação não pode ser desfeita." confirmText="Sim, Cancelar" cancelText="Manter" type="danger" onConfirm={handleConfirmCancel} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default ClientAgendamentos;
