import { useEffect, useState } from 'react';
import { getBarbeiros, deleteBarbeiro } from '../../../api/barbers';
import type { Barbeiro } from '../../../types';
import { Scissors, Phone, Mail, Award, Circle } from 'lucide-react';
import BarbersModal from '../../../components/ui/modals/BarbersModal/BarbersModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';

export default function BarbersView() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barbeiroParaEditar, setBarbeiroParaEditar] = useState<Barbeiro | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchBarbeiros = async () => {
    setLoading(true);
    try {
      const data = await getBarbeiros();
      setBarbeiros(data);
    } catch (e) {
      showToast('Erro ao carregar barbeiros do servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbeiros();
  }, []);

  const handleEditClick = (barbeiro: Barbeiro) => {
    setBarbeiroParaEditar(barbeiro);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setBarberToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (barberToDelete !== null) {
      const success = await deleteBarbeiro(barberToDelete);
      if (success) {
        showToast('Barbeiro removido com sucesso.', 'success');
        fetchBarbeiros();
      } else {
        showToast('Erro ao excluir barbeiro.', 'error');
      }
      setIsConfirmOpen(false);
      setBarberToDelete(null);
    }
  };

  // # Gabriel (Dev 1) - Colunas customizadas para a BarbersView
  const columns: Column<Barbeiro>[] = [
    {
      header: '',
      render: (barbeiro: Barbeiro) => (
        <Circle size={8} fill={barbeiro.ativo ? '#10b981' : '#ef4444'} color="transparent" />
      ),
      style: { width: '40px' }
    },
    {
      header: 'Nome / Especialidade',
      render: (barbeiro: Barbeiro) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{barbeiro.nome}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Award size={12} color="#f59e0b" /> {barbeiro.especialidade}
          </div>
        </div>
      )
    },
    {
      header: 'Contato',
      render: (barbeiro: Barbeiro) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
            <Phone size={12} color="#f59e0b" /> {barbeiro.telefone}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <Mail size={12} color="#64748b" /> {barbeiro.email}
          </div>
        </div>
      ),
      align: 'center'
    },
    {
      header: 'Status',
      render: (barbeiro: Barbeiro) => (
        <span className={`status-badge ${barbeiro.ativo ? 'active' : 'inactive'}`}>
          {barbeiro.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
      align: 'center'
    },
    {
      header: 'Ações',
      render: (barbeiro: Barbeiro) => (
        <ActionButtons 
          onEdit={() => handleEditClick(barbeiro)}
          onDelete={() => handleDeleteClick(barbeiro.id!)}
          theme="amber"
        />
      ),
      align: 'center'
    }
  ];

  return (
    <>
      <DataTable
        title="Nossos Barbeiros"
        icon={Scissors}
        loading={loading}
        data={barbeiros}
        columns={columns}
        addButtonText="Novo Barbeiro"
        onAddClick={() => {
          setBarbeiroParaEditar(null);
          setIsModalOpen(true);
        }}
        themeColor="#f59e0b"
        emptyStateIcon={Scissors}
        emptyStateText="Nenhum barbeiro cadastrado no time."
      />

      <BarbersModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBarbeiroParaEditar(null);
        }}
        onSuccess={fetchBarbeiros}
        barbeiroParaEditar={barbeiroParaEditar}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Demitir Barbeiro"
        message="Tem certeza que deseja remover este profissional do time? Esta ação não pode ser desfeita."
        confirmText="Confirmar Saída"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        type="danger"
      />
    </>
  );
}
