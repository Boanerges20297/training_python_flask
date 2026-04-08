import { useEffect, useState } from 'react';
import { getBarbeiros, deleteBarbeiro } from '../api/barbers';
import type { Barbeiro } from '../types';
import { Scissors, Phone, Mail, Plus, Loader2, Trash2, Edit2, Award, Circle } from 'lucide-react';
import BarbersModal from '../components/modals/BarbersModal/BarbersModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

//Gabriel (Dev 1) - Criação BarbersView com botões de exclusão padronizado como o Ian (Dev 2) fez.

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

  const handleNewBarber = () => {
    setBarbeiroParaEditar(null);
    setIsModalOpen(true);
  };

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
        showToast('Erro ao remover barbeiro.', 'error');
      }
      setIsConfirmOpen(false);
      setBarberToDelete(null);
    }
  };

  return (
    <section className="card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Scissors size={20} color="#f59e0b" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>Nossos Barbeiros</h2>
        </div>
        <button onClick={handleNewBarber} className="btn-primary" style={{ fontSize: '0.875rem', background: '#f59e0b' }}>
          <Plus size={16} /> Novo Barbeiro
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="#f59e0b" />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr style={{ textAlign: 'center' }}>
                <th>Nome</th>
                <th>Especialidade</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {barbeiros.length > 0 ? (
                barbeiros.map((barbeiro) => (
                  <tr key={barbeiro.id} className="fade-in" style={{ textAlign: 'center' }}>
                    <td style={{ fontWeight: 600 }}>{barbeiro.nome}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: '#fbbf24' }}>
                        <Award size={14} />
                        {barbeiro.especialidade}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Phone size={12} color="#f59e0b" /> {barbeiro.telefone}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Mail size={12} color="#f59e0b" /> {barbeiro.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        background: barbeiro.ativo ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: barbeiro.ativo ? '#4ade80' : '#f87171',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <Circle size={8} fill="currentColor" />
                        {barbeiro.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td> {/*Gabriel (Dev 1) - Botões de Editar e Excluir seguindo padrão do Ian (Dev 2)*/}
                      <button
                        onClick={() => handleEditClick(barbeiro)}
                        title="Editar"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f59e0b', padding: '0.25rem' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(barbeiro.id!)}
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
                    <div style={{ opacity: 0.5, marginBottom: '1rem' }}><Scissors size={48} style={{ margin: '0 auto' }} /></div>
                    Nenhum barbeiro cadastrado no time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Barbeiros */}
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
        title="Remover Barbeiro"
        message="Tem certeza que deseja remover este profissional do time? Esta ação não pode ser desfeita."
        confirmText="Remover"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        type="danger"
      />
    </section>
  );
}
