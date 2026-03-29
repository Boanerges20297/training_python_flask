import { useEffect, useState } from 'react';
import { getClientes } from '../api/clients';
import type { Cliente } from '../types';
import { Users, Phone, Mail, Plus, Loader2 } from 'lucide-react';
import ClientModal from '../components/modals/ClientModal/ClientModal';

export default function ClientsView() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleNewClient = () => {
    setIsModalOpen(true);
  };

  return (
    <section className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="#3b82f6" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Clientes Cadastrados</h2>
        </div>
        <button onClick={handleNewClient} className="btn-primary" style={{ fontSize: '0.875rem' }}>
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="#3b82f6" />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Email</th>
                <th>ID</th>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
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
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchClientes} 
      />
    </section>
  );
}
