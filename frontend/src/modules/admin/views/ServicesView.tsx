import { useEffect, useState } from 'react';
import { getServicos, deleteServico } from '../../../api/services';
import type { Servico } from '../../../types';
import { Briefcase, DollarSign, Clock } from 'lucide-react';
import ServiceModal from '../../../components/ui/modals/ServiceModal/ServiceModal';
import { useToast } from '../../../components/ui/Toast';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

export default function ServicesView() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchServicos = async () => {
    setLoading(true);
    try {
      const data = await getServicos();
      setServicos(data);
    } catch (e) {
      showToast('Erro ao carregar serviços.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  const handleNewService = () => {
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
      render: (servico: Servico) => <span style={{ fontWeight: 600 }}>{servico.nome}</span>
    },
    {
      header: 'Preço',
      render: (servico: Servico) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={14} color="#10b981" />
          R$ {Number(servico.preco).toFixed(2)}
        </div>
      ),
      align: 'center'
    },
    {
      header: 'Duração',
      render: (servico: Servico) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
      render: (servico: Servico) => (
        <ActionButtons 
          onDelete={() => handleDeleteClick(servico.id!)}
          theme="green"
        />
      ),
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
      />

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchServicos}
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
