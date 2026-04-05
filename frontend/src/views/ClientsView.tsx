import { useEffect, useState } from 'react';
import { getClientes, deleteCliente } from '../api/clients';
import type { Cliente } from '../types';
import { Users, Phone, Mail, Plus, Loader2, Trash2, Edit2 } from 'lucide-react';
import ClientModal from '../components/modals/ClientModal/ClientModal';
import ConfirmDialog from '../components/ConfirmDialog'; // Importando o novo ConfirmDialog que por enquanto não está sendo utilizado, necessita botão p/ aparecer.
import { useToast } from '../components/Toast';

export default function ClientsView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (e) {
      showToast('Erro ao carregar clientes do servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

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

  const cancelDelete = () => {
    setIsConfirmOpen(false);
    setClientToDelete(null);
  };

  return (
    <section className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="#3b82f6" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Clientes Cadastrados</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={handleNewClient} className="btn-primary" style={{ fontSize: '0.875rem' }}>
            <Plus size={16} /> Novo Cliente
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="#3b82f6" />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr style={{ textAlign: 'center' }}>
                <th>Nome</th>
                <th>Contato</th>
                <th>Email</th>
                <th>ID</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="fade-in">
                    <td style={{ fontWeight: 600 }}>{cliente.nome}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} color="#60a5fa" />
                        {cliente.telefone}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} color="#60a5fa" />
                        {cliente.email}
                      </div>
                    </td>
                    <td><span className="badge">#{cliente.id}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      {/* # Ian (Dev 2)
                      Botões criados para as ações de Editar e Excluir cliente */}
                      <button
                        onClick={() => handleEditClick(cliente)}
                        title="Editar"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: '0.25rem' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cliente.id!)}
                        title="Excluir"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem', marginLeft: '0.5rem' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                    <div style={{ opacity: 0.5, marginBottom: '1rem' }}><Users size={48} style={{ margin: '0 auto' }} /></div>
                    Nenhum cliente encontrado no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Componente Modal Refatorado */}
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
        onCancel={cancelDelete}
        type="danger"
      />
    </section>
  );
}
