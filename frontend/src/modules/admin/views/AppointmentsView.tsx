import { useEffect, useState } from 'react';
import { getAgendamentos, deleteAgendamento } from '../../../api/appointments';
import { getClientes } from '../../../api/clients';
import { getServicos } from '../../../api/services';
import type { Agendamento, Cliente, Servico } from '../../../types';
import { Calendar, Clock, User, Scissors } from 'lucide-react';
import AppointmentModal from '../../../components/ui/modals/AppointmentModal/AppointmentModal';
import { useToast } from '../../../components/ui/Toast';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

export default function AppointmentsView() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agendData, clientData, serviceData] = await Promise.all([
        getAgendamentos(),
        getClientes(),
        getServicos()
      ]);
      setAgendamentos(agendData);
      setClientes(clientData);
      setServicos(serviceData);
    } catch (e) {
      showToast('Erro ao carregar dados da agenda.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteClick = (id: number) => {
    setAppointmentToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (appointmentToDelete !== null) {
      const success = await deleteAgendamento(appointmentToDelete);
      if (success) {
        showToast('Agendamento excluído com sucesso.', 'success');
        fetchData();
      } else {
        showToast('Erro ao excluir agendamento.', 'error');
      }
      setIsConfirmOpen(false);
      setAppointmentToDelete(null);
    }
  };

  // # Gabriel (Dev 1) - Colunas da Agenda
  const columns: Column<Agendamento>[] = [
    {
      header: 'Horário',
      render: (agend: Agendamento) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#a78bfa' }}>
          <Clock size={14} />
          {agend.data_agendamento ? new Date(agend.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </div>
      ),
      align: 'center'
    },
    {
      header: 'Cliente',
      render: (agend: Agendamento) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={14} color="#64748b" />
          #{agend.cliente_id} {/* Futuramente nome do cliente via Join */}
        </div>
      )
    },
    {
      header: 'Profissional',
      render: (agend: Agendamento) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scissors size={14} color="#64748b" />
          #{agend.barbeiro_id}
        </div>
      )
    },
    {
      header: 'Serviço',
      render: (agend: Agendamento) => (
        <span className="badge">#{agend.servico_id}</span>
      ),
      align: 'center'
    },
    {
      header: 'Ações',
      render: (agend: Agendamento) => (
        <ActionButtons 
          onDelete={() => handleDeleteClick(agend.id!)}
          theme="purple"
        />
      ),
      align: 'center'
    }
  ];

  return (
    <>
      <DataTable
        title="Agenda do Dia"
        icon={Calendar}
        loading={loading}
        data={agendamentos}
        columns={columns}
        addButtonText="Novo Agendamento"
        onAddClick={() => setIsModalOpen(true)}
        themeColor="#a78bfa"
        emptyStateIcon={Calendar}
        emptyStateText="Nenhum agendamento para hoje."
      />

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        clientes={clientes}
        servicos={servicos}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Cancelar Agendamento"
        message="Tem certeza que deseja cancelar este agendamento?"
        confirmText="Sim, Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        type="danger"
      />
    </>
  );
}
