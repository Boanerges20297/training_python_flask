import { useEffect, useState, type ReactNode } from 'react';
import { getServicos, deleteServico } from '../../../api/services';
import type { Servico } from '../../../types';
import { Briefcase, DollarSign, Clock, Filter } from 'lucide-react';
import ServiceDrawer from '../components/ServiceDrawer';
import { useToast } from '../../../components/ui/Toast';
import Swal from 'sweetalert2';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Popover from '../../../components/ui/Popover';
import { formatRelativeDate } from '../../../utils/date';
import type { FilterData } from '../../../types/filters';
import Button from '../../../components/ui/Button';

export default function ServicesView() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [servicoParaEditar, setServicoParaEditar] = useState<Servico | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [filters, setFilters] = useState<FilterData>({});
  const [activePopover, setActivePopover] = useState<{
    anchor: HTMLElement;
    content: ReactNode;
    themeColor: string;
  } | null>(null);
  const { showToast } = useToast();

  const fetchServicos = async (currentPage = page) => {
    setLoading(true);
    try {
      const serviceResponse = await getServicos(currentPage, 10);
      setServicos(serviceResponse.items || []);
      setTotalPages(serviceResponse.total_paginas || 1);
    } catch (e) {
      showToast('Erro ao carregar serviços.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicos(page);
  }, [page]);

  const filteredServicos = servicos.filter(s => {
    if (filters.servicoId && String(s.id) !== filters.servicoId) return false;
    // Status para serviços pode ser implementado se houver campo 'ativo' no tipo Servico
    return true;
  });

  const handleNewService = () => {
    setServicoParaEditar(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (servico: Servico) => {
    setServicoParaEditar(servico);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setServiceToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete !== null) {
      const success = await deleteServico(serviceToDelete);
      if (success) {
        showToast('Serviço removido com sucesso.', 'success');
        fetchServicos();
      } else {
        showToast('Erro ao excluir serviço.', 'error');
      }
      setIsConfirmOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleBulkDelete = async (items: Servico[]) => {
    try {
      await Promise.all(items.map(item => deleteServico(item.id!)));
      showToast(`${items.length} serviços removidos.`, 'success');
      fetchServicos();
    } catch (e) {
      showToast('Erro ao remover alguns serviços.', 'error');
    }
  };

  const handleFilterClick = () => {
    Swal.fire({
      title: 'Filtrar Serviços',
      html: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; text-align: left; padding: 0.5rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">Pesquisar por ID</label>
            <input type="number" id="filter-id" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: 5" value="${filters.servicoId || ''}">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">Status</label>
            <input type="text" id="filter-status" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: ativo ou inativo" value="${filters.status || ''}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Filtro',
      cancelButtonText: 'Limpar',
      confirmButtonColor: 'var(--color-primary)',
      background: 'transparent',
      customClass: { popup: 'swal-glass-popup', title: 'swal-glass-title', htmlContainer: 'swal-glass-html' },
      preConfirm: () => {
        return {
          servicoId: (document.getElementById('filter-id') as HTMLInputElement).value,
          status: (document.getElementById('filter-status') as HTMLInputElement).value,
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

  // # Gabriel (Dev 1) - Colunas da Tabela de Serviços
  const columns: Column<Servico>[] = [
    {
      header: '',
      render: (servico: Servico) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {servico.imagem_url ? (
            <img 
              src={servico.imagem_url} 
              alt={servico.nome}
              style={{ 
                width: '86px', 
                height: '50px', 
                borderRadius: '10px', 
                objectFit: 'cover',
                border: '1px solid var(--border-light)'
              }}
            />
          ) : (
            <div style={{ 
              width: '86px', 
              height: '50px', 
              borderRadius: '10px', 
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)'
            }}>
              <Briefcase size={20} />
            </div>
          )}
        </div>
      ),
      style: { width: '60px' }
    },
    {
      header: 'Serviço',
      render: (servico: Servico) => <span className="text-capitalize" style={{ fontWeight: 600 }}>{servico.nome}</span>
    },
    {
      header: 'Preço',
      render: (servico: Servico) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <DollarSign size={14} color="#10b981" />
          R$ {Number(servico.preco).toFixed(2)}
        </div>
      ),
      align: 'center'
    },
    {
      header: 'Duração',
      render: (servico: Servico) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Clock size={14} color="#10b981" />
          {servico.duracao_minutos} min
        </div>
      ),
      align: 'center'
    },
    {
      header: 'ID',
      render: (servico: Servico) => (
        <span className="badge" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
          #{servico.id}
        </span>
      ),
      align: 'center'
    },
    {
      header: 'ÚLTIMA MODIF.',
      render: (serv) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          {formatRelativeDate(serv.data_atualizacao || serv.data_criacao)}
        </span>
      ),
      align: 'center'
    },
    {
      header: 'Ações',
      render: (servico: Servico) => {
        return (
          <ActionButtons
            onEdit={() => handleEditClick(servico)}
            onDelete={() => handleDeleteClick(servico.id!)}
            theme="green"
          />
        );
      },
      align: 'center'
    }
  ];

  const [selectedServices, setSelectedServices] = useState<Servico[]>([]);

  return (
    <>
      <DataTable
        title="Serviços Disponíveis"
        icon={Briefcase}
        loading={loading}
        data={filteredServicos}
        columns={columns}
        extraActions={
          <Button 
            variant="secondary" 
            size="sm"
            icon={<Filter size={16} />}
            onClick={handleFilterClick}
          >
            Filtros
          </Button>
        }
        addButtonText="Novo Serviço"
        onAddClick={handleNewService}
        themeColor="#10b981"
        buttonTheme="green"
        selectable={true}
        selectedItems={selectedServices}
        onSelectionChange={setSelectedServices}
        onBulkDelete={handleBulkDelete}
        renderItemName={(item) => item.nome}
        emptyStateIcon={Briefcase}
        emptyStateText="Nenhum serviço encontrado no sistema."
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          onPageChange: (newPage) => setPage(newPage)
        }}
        enableSearch={true}
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.nome.toLowerCase().includes(q) ||
            String(item.id).includes(q) ||
            String(item.preco).includes(q)
          );
        }}
      />

      <Popover
        isOpen={!!activePopover}
        onClose={() => setActivePopover(null)}
        title="Profissional Responsável"
        content={activePopover?.content || ''}
        anchorEl={activePopover?.anchor || null}
        themeColor={activePopover?.themeColor || '#10b981'}
      />

      <ServiceDrawer
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setServicoParaEditar(null);
        }}
        onSuccess={fetchServicos}
        servicoParaEditar={servicoParaEditar}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Excluir Serviço"
        message="Tem certeza que deseja remover este serviço da grade?"
        confirmText="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        type="danger"
      />
    </>
  );
}
