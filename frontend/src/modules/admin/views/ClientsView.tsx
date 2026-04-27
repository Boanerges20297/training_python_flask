import { useEffect, useState } from 'react';
import { getClientes, deleteCliente } from '../../../api/clients';
import type { Cliente } from '../../../types';
import { Users, Phone, Mail, Filter } from 'lucide-react';
import ClientDrawer from '../components/ClientDrawer';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import Swal from 'sweetalert2';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { formatPhone } from '../../../components/ui/Input';
import { formatRelativeDate } from '../../../utils/date';
import type { FilterData } from '../../../types/filters';
import Button from '../../../components/ui/Button';

export default function ClientsView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterData>({});
  const { showToast } = useToast();

  const fetchClientes = async (currentPage = page) => {
    setLoading(true);
    try {
      // Gabriel (Arquitetura) - Agora o fetch respeita a paginação do Mock
      const response = await getClientes(currentPage, 10);
      setClientes(response.items || []);
      setTotalPages(response.total_paginas || 1);
    } catch (e) {
      showToast('Erro ao carregar clientes do servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchClientes(page);
  }, [page]);

  const filteredClientes = clientes.filter(c => {
    if (filters.clientId && String(c.id) !== filters.clientId) return false;
    if (filters.status) {
      const s = filters.status.toLowerCase();
      if (s === 'devedor' || s === 'com divida' || s === 'deve') {
        if (!c.divida_total || c.divida_total <= 0) return false;
      } else if (s === 'em dia' || s === 'pago') {
        if (c.divida_total && c.divida_total > 0) return false;
      }
    }
    return true;
  });

  const handleNewClient = () => {
    setClienteParaEditar(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (cliente: Cliente) => {
    setClienteParaEditar(cliente);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setClientToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete !== null) {
      const success = await deleteCliente(clientToDelete);
      if (success) {
        showToast('Cliente excluído com sucesso.', 'success');
        fetchClientes();
      } else {
        showToast('Erro ao excluir cliente.', 'error');
      }
      setIsConfirmOpen(false);
      setClientToDelete(null);
    }
  };

  const handleBulkDelete = async (items: Cliente[]) => {
    try {
      await Promise.all(items.map(item => deleteCliente(item.id!)));
      showToast(`${items.length} clientes removidos.`, 'success');
      fetchClientes();
    } catch (e) {
      showToast('Erro ao remover alguns clientes.', 'error');
    }
  };

  const handleFilterClick = () => {
    Swal.fire({
      title: 'Filtrar Clientes',
      html: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; text-align: left; padding: 0.5rem;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">Pesquisar por ID</label>
            <input type="number" id="filter-id" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: 100" value="${filters.clientId || ''}">
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 0.5rem;">Status Financeiro</label>
            <input type="text" id="filter-status" class="swal2-input" style="margin: 0; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 0.75rem; height: 3rem;" placeholder="Ex: Devedor ou Em Dia" value="${filters.status || ''}">
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
          clientId: (document.getElementById('filter-id') as HTMLInputElement).value,
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

  // # Gabriel (Dev 1) - Definição das colunas para o DataTable
  const columns: Column<Cliente>[] = [
    { 
      header: 'Nome', 
      render: (cliente: Cliente) => <span className="text-capitalize" style={{ fontWeight: 600 }}>{cliente.nome}</span> 
    },
    { 
      header: 'Contato', 
      render: (cliente: Cliente) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Phone size={14} color="#60a5fa" /> {formatPhone(cliente.telefone)}
        </div>
      ),
      align: 'center'
    },
    { 
      header: 'Email', 
      render: (cliente: Cliente) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Mail size={14} color="#60a5fa" /> {cliente.email}
        </div>
      ),
      align: 'center'
    },
    { 
      header: 'ID', 
      render: (cliente: Cliente) => <span className="badge">#{cliente.id}</span>,
      align: 'center'
    },
    {
      header: 'Membro desde',
      render: (cliente: Cliente) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          {formatRelativeDate(cliente.data_cadastro)}
        </span>
      ),
      align: 'center'
    },
    {
      header: 'Status',
      render: (cliente: Cliente) => (
        <span className={`badge ${cliente.divida_total && cliente.divida_total > 0 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
          {cliente.divida_total && cliente.divida_total > 0 ? `Deve R$ ${cliente.divida_total.toLocaleString()}` : 'Em dia'}
        </span>
      ),
      align: 'center'
    },
    { 
      header: 'Ações', 
      render: (cliente: Cliente) => (
        <ActionButtons 
          onEdit={() => handleEditClick(cliente)}
          onDelete={() => handleDeleteClick(cliente.id!)}
          theme="blue"
        />
      ),
      align: 'center'
    }
  ];

  const [selectedClients, setSelectedClients] = useState<Cliente[]>([]);

  return (
    <>
      <DataTable 
        title="Clientes Cadastrados"
        icon={Users}
        loading={loading}
        data={filteredClientes}
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
        addButtonText="Novo Cliente"
        onAddClick={handleNewClient}
        emptyStateIcon={Users}
        emptyStateText="Nenhum cliente encontrado no sistema."
        themeColor="#3b82f6"
        buttonTheme="blue"
        selectable={true}
        selectedItems={selectedClients}
        onSelectionChange={setSelectedClients}
        onBulkDelete={handleBulkDelete}
        renderItemName={(item) => item.nome}
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
            item.telefone.includes(q) ||
            String(item.id).includes(q)
          );
        }}
      />

      <ClientDrawer
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setClienteParaEditar(null);
        }}
        onSuccess={fetchClientes}
        clienteParaEditar={clienteParaEditar}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setClientToDelete(null);
        }}
        type="danger"
      />
    </>
  );
}
