import { useEffect, useState } from 'react';
import { getAgendamentos, deleteAgendamento } from '../../../api/appointments';
import { getClientes } from '../../../api/clients';
import { getServicos } from '../../../api/services';
import { getBarbeiros } from '../../../api/barbers';
import type { Agendamento, Cliente, Servico, Barbeiro } from '../../../types';
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
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agendData, clientData, serviceData, barberData] = await Promise.all([
        getAgendamentos(),
        getClientes(),
        getServicos(),
        getBarbeiros()
      ]);
      setAgendamentos(agendData);
      setClientes(clientData);
      setServicos(serviceData);
      setBarbeiros(barberData);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, color: '#a78bfa' }}>
          <Clock size={14} />
          {agend.data_agendamento ? new Date(agend.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </div>
      ),
      align: 'center'
    },
    {
      header: 'Cliente',
      render: (agend: Agendamento) => {
        const cliente = clientes.find(c => c.id === agend.cliente_id);
        return (
          <div className="text-capitalize" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <User size={14} color="#64748b" />
            {cliente ? cliente.nome : 'Carregando...'} #{agend.cliente_id} {/* Futuramente nome do cliente via Join */}
          </div>
        );
      },
      align: 'center'
    },
    {
      header: 'Profissional',
      render: (agend: Agendamento) => {
        const barbeiro = barbeiros.find(b => b.id === agend.barbeiro_id);
        return (
          <div className="text-capitalize" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <Scissors size={14} color="#64748b" />
            {barbeiro ? barbeiro.nome : 'Carregando...'} #{agend.barbeiro_id}
          </div>
        );
      },
      align: 'center'
    },
    {
      header: 'Serviço',
      render: (agend: Agendamento) => {
        const servico = servicos.find(s => s.id === agend.servico_id);
        return (
          <span className="badge text-capitalize">
            {servico ? servico.nome : 'Carregando...'} #{agend.servico_id}
          </span>
        );
      },
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
        buttonTheme="purple"
        buttonSize="md"
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
