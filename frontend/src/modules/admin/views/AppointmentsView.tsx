import { useEffect, useState, useMemo } from 'react';
import { getAgendamentos, deleteAgendamento } from '../../../api/appointments';
import { getClientes } from '../../../api/clients';
import { getServicos } from '../../../api/services';
import { getBarbeiros } from '../../../api/barbers';
import type { Agendamento, Cliente, Servico, Barbeiro } from '../../../types';
import { Calendar, Clock, User, Scissors, AlertTriangle, ShoppingBag } from 'lucide-react';
import AppointmentDrawer from '../components/AppointmentDrawer';
import { useToast } from '../../../components/ui/Toast';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Popover from '../../../components/ui/Popover';

export default function AppointmentsView() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<number | null>(null);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<Agendamento | null>(null);

  // Estado para controlar o Popover de Observações
  const [activePopover, setActivePopover] = useState<{
    id: number;
    anchor: HTMLElement;
    obs: string;
    barberInativo?: boolean;
  } | null>(null);

  const { showToast } = useToast();

  const fetchData = async (currentPage = page) => {
    setLoading(true);
    try {
      const [agendResponse, clientData, serviceData, barberData] = await Promise.all([
        getAgendamentos(currentPage, 10),
        getClientes(1, 100), // Carregamos todos para o map de nomes
        getServicos(1, 100),
        getBarbeiros(1, 100)
      ]);
      setAgendamentos(agendResponse.items || []);
      setTotalPages(agendResponse.total_paginas || 1);
      setClientes(clientData.items || []);
      setServicos(serviceData.items || []);
      setBarbeiros(barberData.items || []);
    } catch (e) {
      showToast('Erro ao carregar dados da agenda.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // # Gabriel (Arquitetura) - Otimização de Performance O(1)
  // BUG: Busca linear (find) dentro do render da tabela causa peso Big O excessivo.
  // REMOVER QUANDO: O Backend implementar JOINs nas rotas de agendamento.
  const clientMap = useMemo(() => {
    const map: Record<number, string> = {};
    clientes.forEach(c => { if (c.id) map[c.id] = c.nome; });
    return map;
  }, [clientes]);

  const barberMap = useMemo(() => {
    const map: Record<number, string> = {};
    barbeiros.forEach(b => { if (b.id) map[b.id] = b.nome; });
    return map;
  }, [barbeiros]);

  // REMOVER QUANDO: O Backend implementar JOINs nas rotas de agendamento.
  const barberStatusMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    barbeiros.forEach(b => { if (b.id) map[b.id] = b.ativo; });
    return map;
  }, [barbeiros]);

  const serviceMap = useMemo(() => {
    const map: Record<number, string> = {};
    servicos.forEach(s => { if (s.id) map[s.id] = s.nome; });
    return map;
  }, [servicos]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

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
        const nome = clientMap[agend.cliente_id];
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="badge text-capitalize" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.6rem',
              minWidth: '140px'
            }}>
              <User size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 500, flex: 1 }}>{nome || 'Carregando...'}</span>
              <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>#{agend.cliente_id}</span>
            </div>
          </div>
        );
      },
      align: 'center'
    },
    {
      header: 'Profissional',
      render: (agend: Agendamento) => {
        const nome = barberMap[agend.barbeiro_id];
        const isInativo = barberStatusMap[agend.barbeiro_id] === false;
        // REMOVER QUANDO: O Backend implementar JOINs nas rotas de agendamento.
        const color = isInativo ? '#ef4444' : '#f59e0b';
        const bg = isInativo ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.1)';
        const border = isInativo ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid transparent';

        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="badge text-capitalize" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: bg,
              color: color,
              padding: '0.4rem 0.8rem',
              borderRadius: '0.6rem',
              minWidth: '140px',
              border: border
            }}>
              <Scissors size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 500, flex: 1 }}>{nome || 'Carregando...'}</span>
              <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>#{agend.barbeiro_id}</span>
              {isInativo && <AlertTriangle size={14} style={{ marginLeft: '2px', flexShrink: 0 }} />}
            </div>
          </div>
        );
      },
      align: 'center'
    },
    {
      header: 'Serviço',
      render: (agend: Agendamento) => {
        const nome = serviceMap[agend.servico_id];
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="badge text-capitalize" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.6rem',
              minWidth: '130px'
            }}>
              <ShoppingBag size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 500, flex: 1 }}>{nome || 'Carregando...'}</span>
              <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>#{agend.servico_id}</span>
            </div>
          </div>
        );
      },
      align: 'center'
    },
    {
      header: 'ID',
      render: (agend: Agendamento) => <span className="badge" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}>#{agend.id}</span>,
      align: 'center',
    },
    {
      header: 'Ações',
      render: (agend: Agendamento) => {
        const isInativo = barberStatusMap[agend.barbeiro_id] === false;
        return (
          <ActionButtons
            onInfo={(e) => setActivePopover({
              id: agend.id!,
              anchor: e.currentTarget as HTMLElement,
              obs: agend.observacoes || '',
              barberInativo: isInativo
            })}
            onEdit={() => {
              setAgendamentoParaEditar(agend);
              setIsModalOpen(true);
            }}
            onDelete={() => handleDeleteClick(agend.id!)}
            theme="purple"
          />
        );
      },
      align: 'center'
    }
  ];

  const [selectedAppointments, setSelectedAppointments] = useState<Agendamento[]>([]);

  return (
    <>
      <DataTable
        title="Agenda do Dia"
        icon={Calendar}
        loading={loading}
        data={agendamentos}
        columns={columns}
        addButtonText="Novo Agendamento"
        onAddClick={() => {
          setAgendamentoParaEditar(null);
          setIsModalOpen(true);
        }}
        themeColor="#a78bfa"
        buttonTheme="purple"
        buttonSize="md"
        selectable={true}
        selectedItems={selectedAppointments}
        onSelectionChange={setSelectedAppointments}
        emptyStateIcon={Calendar}
        emptyStateText="Nenhum agendamento para hoje."
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          onPageChange: (newPage) => setPage(newPage)
        }}
        enableSearch={true}
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          const cName = clientMap[item.cliente_id] || '';
          const bName = barberMap[item.barbeiro_id] || '';
          const sName = serviceMap[item.servico_id] || '';
          return (
            cName.toLowerCase().includes(q) ||
            bName.toLowerCase().includes(q) ||
            sName.toLowerCase().includes(q) ||
            String(item.id).includes(q)
          );
        }}
      />

      <Popover
        isOpen={!!activePopover}
        onClose={() => setActivePopover(null)}
        title="Observações"
        content={
          activePopover?.barberInativo ? (
            <>
              <b>Conflito:</b> O profissional deste agendamento está inativo.
              <br />
              <b>Descrição:</b> {activePopover?.obs || 'Sem observações registradas.'}
            </>
          ) : (
            activePopover?.obs || 'Sem observações registradas.'
          )
        }
        anchorEl={activePopover?.anchor || null}
        themeColor={activePopover?.barberInativo ? '#ef4444' : '#a78bfa'}
      />

      <AppointmentDrawer
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAgendamentoParaEditar(null);
        }}
        onSuccess={fetchData}
        clientes={clientes}
        servicos={servicos}
        barbeiros={barbeiros}
        agendamentoParaEditar={agendamentoParaEditar}
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
