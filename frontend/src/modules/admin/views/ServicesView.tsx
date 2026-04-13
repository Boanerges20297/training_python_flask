import { useEffect, useState, type ReactNode } from 'react';
import { getServicos, deleteServico } from '../../../api/services';
import { getBarbeiros } from '../../../api/barbers';
import type { Servico, Barbeiro } from '../../../types';
import { Briefcase, DollarSign, Clock } from 'lucide-react';
import ServiceModal from '../../../components/ui/modals/ServiceModal/ServiceModal';
import { useToast } from '../../../components/ui/Toast';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Popover from '../../../components/ui/Popover';

export default function ServicesView() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
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
      const [serviceResponse, barberResponse] = await Promise.all([
        getServicos(currentPage, 10),
        getBarbeiros(1, 100)
      ]);
      setServicos(serviceResponse.items || []);
      setTotalPages(serviceResponse.total_paginas || 1);
      setBarbeiros(barberResponse.items || []);
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
        // REMOVER QUANDO: O Backend retornar informações do barbeiro junto ao serviço (JOIN).
        const barbeiro = barbeiros.find(b => b.id === servico.barbeiro_id);
        const isInativo = barbeiro ? !barbeiro.ativo : false;
        const infoColor = isInativo ? '#ef4444' : '#10b981';
        const infoContent = barbeiro ? (
          <>
            <b>Profissional:</b> {barbeiro.nome}
            <br />
            <b>Status:</b> {barbeiro.ativo ? ' Ativo' : ' Inativo - Conflito detectado!'}
          </>
        ) : (
          'Barbeiro não encontrado.'
        );
        return (
          <ActionButtons
            onInfo={(e) => setActivePopover({
              anchor: e.currentTarget as HTMLElement,
              content: infoContent,
              themeColor: infoColor
            })}
            onEdit={() => handleEditClick(servico)}
            onDelete={() => handleDeleteClick(servico.id!)}
            theme="green"
          />
        );
      },
      align: 'center'
    }
  ];

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
        emptyStateIcon={Briefcase}
        emptyStateText="Nenhum serviço encontrado no sistema."
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          onPageChange: (newPage) => setPage(newPage)
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

      <ServiceModal
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
