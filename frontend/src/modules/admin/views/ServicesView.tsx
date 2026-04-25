import { useEffect, useState, type ReactNode } from 'react';
import { getServicos, deleteServico } from '../../../api/services';
import type { Servico } from '../../../types';
import { Briefcase, DollarSign, Clock } from 'lucide-react';
import ServiceDrawer from '../components/ServiceDrawer';
import { useToast } from '../../../components/ui/Toast';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Popover from '../../../components/ui/Popover';

export default function ServicesView() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [servicoParaEditar, setServicoParaEditar] = useState<Servico | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
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
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                objectFit: 'cover',
                border: '1px solid var(--border-light)'
              }}
            />
          ) : (
            <div style={{ 
              width: '40px', 
              height: '40px', 
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
      header: 'Ações',
      render: (servico: Servico) => {
        return (
          <ActionButtons
            onView={() => handleEditClick(servico)}
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
        data={servicos}
        columns={columns}
        addButtonText="Novo Serviço"
        onAddClick={handleNewService}
        themeColor="#10b981"
        buttonTheme="green"
        selectable={true}
        selectedItems={selectedServices}
        onSelectionChange={setSelectedServices}
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
