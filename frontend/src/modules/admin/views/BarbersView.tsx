import { useEffect, useState } from 'react';
import { getBarbeiros, deleteBarbeiro } from '../../../api/barbers';
import type { Barbeiro } from '../../../types';
import { Scissors, Phone, Mail, Award, Circle } from 'lucide-react';
import BarberDrawer from '../components/BarberDrawer';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { formatPhone } from '../../../components/ui/Input';
import { getSpecialtyLabel } from '../constants/specialties';

export default function BarbersView() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barbeiroParaEditar, setBarbeiroParaEditar] = useState<Barbeiro | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchBarbeiros = async (currentPage = page) => {
    setLoading(true);
    try {
      const response = await getBarbeiros(currentPage, 10);
      setBarbeiros(response.items || []);
      setTotalPages(response.total_paginas || 1);
    } catch (e) {
      showToast('Erro ao carregar barbeiros do servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbeiros(page);
  }, [page]);

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
      render: (barbeiro: Barbeiro) => {
        // Garantimos que o círculo mude de cor tratando o valor como booleano
        const isActive = !!barbeiro.ativo;
        return (
          <Circle size={8} fill={isActive ? '#10b981' : '#ef4444'} color="transparent" />
        );
      },
      style: { width: '40px' }
    },
    {
      header: 'Nome',
      render: (barbeiro: Barbeiro) => (
        <div className="text-capitalize" style={{ fontWeight: 600, color: '#f8fafc' }}>{barbeiro.nome}</div>
      ),
      align: 'left'
    },
    {
      header: 'Especialidade',
      render: (barbeiro: Barbeiro) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem', 
          color: '#94a3b8'
        }}>
          <Award size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span className="text-capitalize">{getSpecialtyLabel(barbeiro.especialidade)}</span>
        </div>
      ),
      align: 'center',
      style: { width: '200px' }
    },
    {
      header: 'Contato',
      render: (barbeiro: Barbeiro) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={12} color="#f59e0b" style={{ flexShrink: 0 }} /> {formatPhone(barbeiro.telefone)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <Mail size={12} color="#64748b" style={{ flexShrink: 0 }} /> {barbeiro.email}
          </div>
        </div>
      ),
      align: 'center',
      style: { width: '220px' }
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
      header: 'ID',
      render: (barbeiro: Barbeiro) => <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>#{barbeiro.id}</span>,
      align: 'center'
    },
    {
      header: 'Ações',
      render: (barbeiro: Barbeiro) => (
        <ActionButtons 
          onView={() => handleEditClick(barbeiro)}
          onDelete={() => handleDeleteClick(barbeiro.id!)}
          theme="amber"
        />
      ),
      align: 'center'
    }
  ];

  const [selectedBarbers, setSelectedBarbers] = useState<Barbeiro[]>([]);

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
        buttonTheme="amber"
        selectable={true}
        selectedItems={selectedBarbers}
        onSelectionChange={setSelectedBarbers}
        emptyStateIcon={Scissors}
        emptyStateText="Nenhum barbeiro cadastrado no time."
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
            item.email.toLowerCase().includes(q) ||
            (item.especialidade || '').toLowerCase().includes(q) ||
            String(item.id).includes(q)
          );
        }}
      />

      <BarberDrawer
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
