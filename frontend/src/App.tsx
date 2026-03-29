import { useEffect, useState } from 'react';
import { getClientes } from './api/api';
import type { Cliente } from './api/api';
import { Users, Phone, Mail, Plus, Loader2, Database } from 'lucide-react';

function App() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getClientes();
        setClientes(data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Database size={32} color="#3b82f6" />
          <h1 style={{ margin: 0 }}>Portal Administrativo</h1>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Novo Cliente
        </button>
      </header>

      <section className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Users size={20} color="#94a3b8" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#94a3b8' }}>Clientes Cadastrados</h2>
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
                    <tr key={cliente.id}>
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
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      Nenhum cliente encontrado no sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
        Backend: <strong>Python/Flask (API)</strong> • Frontend: <strong>React/Vite (Modern Architecture)</strong>
      </footer>
    </div>
  );
}

export default App;
