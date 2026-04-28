import { useEffect, useState } from 'react';
import { getBarbeiros, deleteBarbeiro } from '../../../api/barbers';
import type { Barbeiro } from '../../../types';
import { Scissors, Phone, Mail, Award, Circle, Filter } from 'lucide-react';
import BarberDrawer from '../components/BarberDrawer';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import Swal from 'sweetalert2';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { formatPhone } from '../../../components/ui/Input';
import { getSpecialtyLabel } from '../constants/specialties';
import { formatRelativeDate } from '../../../utils/date';
import type { FilterData } from '../../../types/filters';
import Button from '../../../components/ui/Button';

export default function BarbersView() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barbeiroParaEditar, setBarbeiroParaEditar] = useState<Barbeiro | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterData>({});
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

  const filteredBarbeiros = barbeiros.filter(b => {
    if (filters.profissionalId && String(b.id) !== filters.profissionalId) return false;
    if (filters.status) {
      const s = filters.status.toLowerCase();
      if (s === 'ativo' || s === 'on') {
        if (!b.ativo) return false;
      } else if (s === 'inativo' || s === 'off') {
        if (b.ativo) return false;
      }
    }
    return true;
  });

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

  const handleBulkDelete = async (items: Barbeiro[]) => {
    try {
      await Promise.all(items.map(item => deleteBarbeiro(item.id!)));
      showToast(`${items.length} barbeiros removidos.`, 'success');
      fetchBarbeiros();
    } catch (e) {
      showToast('Erro ao remover alguns barbeiros.', 'error');
    }
  };

  const handleFilterClick = () => {
    Swal.fire({
      title: 'Filtrar Equipe',
      html: `
        <div class="swal-grid">
          <div class="swal-form-group swal-col-4">
            <label class="swal-input-label">ID</label>
            <input type="number" id="filter-id" class="swal-input-premium" placeholder="Ex: 10" value="${filters.profissionalId || ''}">
          </div>
          <div class="swal-form-group swal-col-8">
            <label class="swal-input-label">Status</label>
            <input type="text" id="filter-status" class="swal-input-premium" placeholder="Ex: ativo ou inativo" value="${filters.status || ''}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Filtro',
      cancelButtonText: 'Limpar',
      buttonsStyling: false,
      customClass: { 
        popup: 'swal-glass-popup', 
        title: 'swal-glass-title', 
        htmlContainer: 'swal-glass-html',
        confirmButton: 'btn btn-md btn-primary theme-purple',
        cancelButton: 'btn btn-md btn-secondary'
      },
      preConfirm: () => {
        return {
          profissionalId: (document.getElementById('filter-id') as HTMLInputElement).value,
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
      header: 'Foto',
      render: (barbeiro: Barbeiro) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '10px', 
            background: 'var(--color-barber-light)', color: 'var(--color-barber)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '0.9rem', fontWeight: 800, overflow: 'hidden' 
          }}>
            {barbeiro.imagem_url ? (
              <img src={barbeiro.imagem_url} alt={barbeiro.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              barbeiro.nome.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      ),
      align: 'center'
    },
    {
      header: 'Nome',
      render: (barbeiro: Barbeiro) => (
        <div className="text-capitalize" style={{ fontWeight: 600 }}>{barbeiro.nome}</div>
      ),
      align: 'left'
    },
    {
      header: 'Especialidades',
      render: (barbeiro: Barbeiro) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Award size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {barbeiro.especialidades?.slice(0, 2).map((e, idx) => (
              <span key={e} className="text-capitalize" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {getSpecialtyLabel(e)}{idx === 0 && barbeiro.especialidades!.length > 1 && ','}
              </span>
            ))}
            {barbeiro.especialidades?.length > 2 && (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 800 }}>+{barbeiro.especialidades.length - 2}</span>
            )}
            {(!barbeiro.especialidades || barbeiro.especialidades.length === 0) && <span className="badge">N/A</span>}
          </div>
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
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <span className="pill" style={{ 
            background: barbeiro.ativo ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: barbeiro.ativo ? '#10b981' : '#ef4444',
            border: `1px solid ${barbeiro.ativo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            fontSize: '0.7rem'
          }}>
            {barbeiro.ativo ? 'ATIVO' : 'INATIVO'}
          </span>
        </div>
      ),
      align: 'center'
    },
    {
      header: 'ID',
      render: (barbeiro: Barbeiro) => <span className="badge badge-amber">#{barbeiro.id}</span>,
      align: 'center'
    },
    {
      header: 'Membro Desde',
      render: (barbeiro: Barbeiro) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          {formatRelativeDate(barbeiro.data_cadastro)}
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

  const [selectedBarbers, setSelectedBarbers] = useState<Barbeiro[]>([]);

  return (
    <>
      <DataTable
        title="Nossos Barbeiros"
        icon={Scissors}
        loading={loading}
        data={filteredBarbeiros}
        columns={columns}
        extraActions={
          <Button 
            variant="ghost" 
            theme="amber" 
            size="sm"
            icon={<Filter size={16} />}
            onClick={handleFilterClick}
            style={{ 
              background: Object.keys(filters).some(k => (filters as any)[k]) ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              border: Object.keys(filters).some(k => (filters as any)[k]) ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent'
            }}
          >
            Filtros
            {Object.keys(filters).filter(k => (filters as any)[k]).length > 0 && (
              <span style={{ 
                marginLeft: '0.5rem', 
                background: 'var(--color-barber)', 
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
        selectable={true}
        addButtonText="Novo Barbeiro"
        onAddClick={() => {
          setBarbeiroParaEditar(null);
          setIsModalOpen(true);
        }}
        themeColor="#f59e0b"
        buttonTheme="amber"
        selectedItems={selectedBarbers}
        onSelectionChange={setSelectedBarbers}
        onBulkDelete={handleBulkDelete}
        renderItemName={(item) => item.nome}
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
            (item.especialidades || []).some(e => getSpecialtyLabel(e).toLowerCase().includes(q)) ||
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
