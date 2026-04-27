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
import { formatRelativeDate } from '../../../utils/date';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import type { FilterData } from '../../../types/filters';
import { Filter } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Swal from 'sweetalert2';

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
  const [filters, setFilters] = useState<FilterData>({});


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

  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter(agend => {
      // Filtro de Data
      if (filters.dataInicio) {
        const start = new Date(filters.dataInicio);
        if (new Date(agend.data_agendamento) < start) return false;
      }
      if (filters.dataFim) {
        const end = new Date(filters.dataFim);
        end.setHours(23, 59, 59, 999);
        if (new Date(agend.data_agendamento) > end) return false;
      }
      // Filtro de Profissional
      if (filters.profissionalId && agend.barbeiro_id !== parseInt(filters.profissionalId)) {
        return false;
      }
      // Filtro de Serviço
      if (filters.servicoId && !agend.servicos_ids?.includes(parseInt(filters.servicoId))) {
        return false;
      }
      // Filtro de Status
      if (filters.status && agend.status && !agend.status.toLowerCase().includes(filters.status.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [agendamentos, filters]);

  const handleDeleteClick = (id: number) => {
    setAppointmentToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (appointmentToDelete !== null) {
      const success = await deleteAgendamento(appointmentToDelete);
      if (success) {
        showToast('Agendamento removido com sucesso.', 'success');
        fetchData();
      } else {
        showToast('Erro ao excluir agendamento.', 'error');
      }
      setIsConfirmOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleBulkDelete = async (items: Agendamento[]) => {
    try {
      await Promise.all(items.map(item => deleteAgendamento(item.id!)));
      showToast(`${items.length} agendamentos removidos.`, 'success');
      fetchData();
    } catch (e) {
      showToast('Erro ao remover alguns agendamentos.', 'error');
    }
  };

  const handleFilterClick = () => {
    Swal.fire({
      title: 'Filtrar Agenda',
      html: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; text-align: left; padding: 0.5rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">ID do Profissional</label>
            <input type="number" id="filter-profissional" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: 10" value="${filters.profissionalId || ''}">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">ID do Serviço</label>
            <input type="number" id="filter-servico" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: 5" value="${filters.servicoId || ''}">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">Status</label>
            <input type="text" id="filter-status" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: pendente, concluído..." value="${filters.status || ''}">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">De</label>
              <input type="date" id="filter-inicio" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" value="${filters.dataInicio || ''}">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">Até</label>
              <input type="date" id="filter-fim" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" value="${filters.dataFim || ''}">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Filtros',
      cancelButtonText: 'Limpar Tudo',
      confirmButtonColor: 'var(--color-primary)',
      background: 'transparent',
      customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html' },
      preConfirm: () => {
        return {
          profissionalId: (document.getElementById('filter-profissional') as HTMLInputElement).value,
          servicoId: (document.getElementById('filter-servico') as HTMLInputElement).value,
          status: (document.getElementById('filter-status') as HTMLInputElement).value,
          dataInicio: (document.getElementById('filter-inicio') as HTMLInputElement).value,
          dataFim: (document.getElementById('filter-fim') as HTMLInputElement).value,
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setFilters(result.value);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        setFilters({});
      }
    });
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
              minWidth: '120px'
            }}>
              <User size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600, flex: 1 }}>{nome || 'Carregando...'}</span>
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
              minWidth: '120px',
              border: border
            }}>
              <Scissors size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600, flex: 1 }}>{nome || 'Carregando...'}</span>
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
        const sIds = agend.servicos_ids || [];
        const nomes = sIds.map(id => serviceMap[id] || `S#${id}`).join(' + ');
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
              minWidth: '130px',
              maxWidth: '180px'
            }}>
              <ShoppingBag size={14} style={{ flexShrink: 0 }} />
              <span style={{ 
                fontWeight: 600, flex: 1, 
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontSize: '0.85rem'
              }} title={nomes}>
                {nomes || 'Nenhum'}
              </span>
              {sIds.length > 1 && (
                <span style={{ 
                  background: 'var(--color-service)', color: 'white', 
                  fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '0.5rem',
                  fontWeight: 900, flexShrink: 0
                }}>
                  +{sIds.length - 1}
                </span>
              )}
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
      header: 'Última Modif.',
      render: (agend: Agendamento) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          {formatRelativeDate(agend.data_atualizacao || agend.data_criacao)}
        </span>
      ),
      align: 'center'
    },
    {
      header: 'Pagamento',
      render: (agend: Agendamento) => (
        <span className={`badge ${agend.pago ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
          {agend.pago ? 'Pago' : 'Pendente'}
        </span>
      ),
      align: 'center'
    },
    {
      header: 'Ações',
      render: (agend: Agendamento) => {
    
        return (
          <ActionButtons
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
        data={filteredAgendamentos}
        columns={columns}
        extraActions={
          <Button 
            variant="ghost" 
            theme="purple" 
            size="sm"
            icon={<Filter size={16} />}
            onClick={handleFilterClick}
            style={{ 
              background: Object.keys(filters).some(k => (filters as any)[k]) ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
              border: Object.keys(filters).some(k => (filters as any)[k]) ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid transparent'
            }}
          >
            Filtros
            {Object.keys(filters).filter(k => (filters as any)[k]).length > 0 && (
              <span style={{ 
                marginLeft: '0.5rem', 
                background: 'var(--color-appointment)', 
                color: 'white', 
                borderRadius: '50%', 
                width: '18px', 
                height: '18px', 
                fontSize: '0.65rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 800
              }}>
                {Object.keys(filters).filter(k => (filters as any)[k]).length}
              </span>
            )}
          </Button>
        }
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
        onBulkDelete={handleBulkDelete}
        renderItemName={(item) => `${clientMap[item.cliente_id]} - ${new Date(item.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
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
        allAgendamentos={agendamentos}
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
