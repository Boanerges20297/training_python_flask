import { useEffect, useState } from 'react';
import { getClientes, deleteCliente } from '../../../api/clients';
import type { Cliente } from '../../../types';
import { Users, Phone, Mail } from 'lucide-react';
import ClientModal from '../../../components/ui/modals/ClientModal/ClientModal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import ActionButtons from '../../../components/ui/ActionButtons';
import DataTable from '../../../components/ui/DataTable';
import type { Column } from '../../../components/ui/DataTable';
import { formatPhone } from '../../../components/ui/Input';

export default function ClientsView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
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

  return (
    <>
      <DataTable 
        title="Clientes Cadastrados"
        icon={Users}
        loading={loading}
        data={clientes}
        columns={columns}
        addButtonText="Novo Cliente"
        onAddClick={handleNewClient}
        emptyStateIcon={Users}
        emptyStateText="Nenhum cliente encontrado no sistema."
        themeColor="#3b82f6"
        buttonTheme="blue"
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

      <ClientModal
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
