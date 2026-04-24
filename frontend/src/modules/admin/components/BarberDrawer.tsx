// BarberDrawer — Drawer de criação/edição de barbeiros
import React, { useState, useEffect } from 'react';
import { createBarbeiro, updateBarbeiro } from '../../../api/barbers';
import { getServicos } from '../../../api/services';
import type { Barbeiro, Servico } from '../../../types';
import { User, Phone, Mail, Plus, Edit2, Lock, ToggleLeft, ToggleRight, Scissors } from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import Input, { cleanPhone } from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { SPECIALTIES, getSpecialtyLabel } from '../constants/specialties';
import drawerStyles from '../../../components/ui/Drawer.module.css';

interface BarberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  barbeiroParaEditar?: Barbeiro | null;
}

const BarberDrawer: React.FC<BarberDrawerProps> = ({ isOpen, onClose, onSuccess, barbeiroParaEditar }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ 
    nome: '', 
    especialidade: '', 
    email: '', 
    telefone: '', 
    senha: '', 
    ativo: true,
    justificativa: '',
    servicos_ids: [] as number[]
  });
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (barbeiroParaEditar) {
        setFormData({
          nome: barbeiroParaEditar.nome,
          especialidade: barbeiroParaEditar.especialidade,
          email: barbeiroParaEditar.email,
          telefone: barbeiroParaEditar.telefone,
          senha: '',
          ativo: barbeiroParaEditar.ativo,
          justificativa: barbeiroParaEditar.justificativa || '',
          servicos_ids: barbeiroParaEditar.servicos_ids || []
        });
        setMode('view');
      } else {
        setFormData({ nome: '', especialidade: '', email: '', telefone: '', senha: '', ativo: true, justificativa: '', servicos_ids: [] });
        setMode('edit');
      }

      const fetchServicos = async () => {
        try {
          const response = await getServicos(1, 100);
          setServicos(response.items || []);
        } catch (err) {
          console.error("Erro ao carregar serviços:", err);
        }
      };
      fetchServicos();
    }
  }, [isOpen, barbeiroParaEditar]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.telefone.replace(/\D/g, "").length < 10) {
      showToast("Por favor, insira um telefone válido com DDD.", 'error');
      return;
    }
    if (!isValidEmail(formData.email)) {
      showToast("Por favor, insira um e-mail válido.", 'error');
      return;
    }
    if (!barbeiroParaEditar && !formData.senha) {
      showToast("A senha é obrigatória para o cadastro.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (barbeiroParaEditar) {
        const { senha, ...updateData } = formData;
        const payload = { ...updateData, telefone: cleanPhone(formData.telefone) };
        const success = await updateBarbeiro(barbeiroParaEditar.id!, payload);
        if (!success) throw new Error("Erro ao atualizar barbeiro.");
        showToast('Perfil atualizado com sucesso!', 'success');
      } else {
        const payload = { ...formData, telefone: cleanPhone(formData.telefone) };
        await createBarbeiro(payload);
        showToast('Barbeiro adicionado ao time!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || err.response?.data?.erro || 'Erro ao processar solicitação.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Encontra o label da especialidade para exibir corretamente valores legados
  const specialtyOptions = SPECIALTIES.map(s => ({ value: s.value, label: s.label }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'view' ? barbeiroParaEditar?.nome || "Detalhes" : (barbeiroParaEditar ? "Editar Barbeiro" : "Novo Barbeiro")}
      subtitle={mode === 'view' ? getSpecialtyLabel(barbeiroParaEditar?.especialidade || '') : (barbeiroParaEditar ? "Atualize o perfil do profissional." : "Adicione um novo profissional ao time.")}
      icon={<Scissors size={20} color="var(--color-barber)" />}
      iconBg="var(--color-barber-light)"
      iconBorder="var(--color-barber-border)"
      footer={
        mode === 'view' ? (
          <>
            <Button
              theme="amber"
              onClick={() => setMode('edit')}
              icon={<Edit2 size={18} />}
            >
              Editar Informações
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </>
        ) : (
          <>
            <Button
              theme="amber"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              icon={barbeiroParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
            >
              {barbeiroParaEditar ? "Salvar Alterações" : "Adicionar Barbeiro"}
            </Button>
            <Button variant="ghost" onClick={() => barbeiroParaEditar ? setMode('view') : onClose()} disabled={isSubmitting}>
              Cancelar
            </Button>
          </>
        )
      }
    >
      {mode === 'view' && barbeiroParaEditar ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Avatar Area Bento */}
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              width: '64px', height: '64px', 
              borderRadius: '50%', 
              background: 'var(--color-barber-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-barber)', fontSize: '1.5rem', fontWeight: 'bold'
            }}>
              {barbeiroParaEditar.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{barbeiroParaEditar.nome}</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Especialista em {getSpecialtyLabel(barbeiroParaEditar.especialidade)}</p>
              <div style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, background: barbeiroParaEditar.ativo ? 'var(--color-service-light)' : 'var(--bg-tertiary)', color: barbeiroParaEditar.ativo ? 'var(--color-service)' : 'var(--text-secondary)' }}>
                {barbeiroParaEditar.ativo ? 'Ativo' : 'Afastado'}
              </div>
            </div>
          </div>

          {/* Contato Bento */}
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Informações de Contato</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={16} color="var(--text-tertiary)" />
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{barbeiroParaEditar.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={16} color="var(--text-tertiary)" />
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{barbeiroParaEditar.telefone}</span>
              </div>
            </div>
          </div>

          {/* Justificativa Bento (Se inativo) */}
          {!barbeiroParaEditar.ativo && barbeiroParaEditar.justificativa && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              padding: '1.5rem', 
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#f87171', fontSize: '0.875rem', textTransform: 'uppercase' }}>Motivo do Afastamento</h4>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                {barbeiroParaEditar.justificativa}
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
        <Input
          label="Nome do Barbeiro"
          type="text"
          icon={<User size={18} />}
          placeholder="Nome completo"
          required
          maxLength={100}
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          autoFocus
        />

        <Select
          label="Especialidade"
          icon={<Scissors size={18} />}
          options={specialtyOptions}
          placeholder="Selecione a especialidade..."
          required
          value={formData.especialidade}
          onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
        />

        <div className={drawerStyles.drawerGrid}>
          <Input
            label="Telefone"
            mask="phone"
            type="tel"
            icon={<Phone size={18} />}
            placeholder="(00) 00000-0000"
            required
            maxLength={15}
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />
          <Input
            label="E-mail"
            type="email"
            icon={<Mail size={18} />}
            placeholder="email@barbearia.com"
            required
            maxLength={100}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        {!barbeiroParaEditar && (
          <Input
            label="Senha Provisória"
            type="password"
            icon={<Lock size={18} />}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
            maxLength={20}
            value={formData.senha}
            onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
          />
        )}

        {/* Seleção de Serviços Múltiplos */}
        <div>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
            Serviços Realizados
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            {servicos.length > 0 ? servicos.map(servico => (
              <label key={servico.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.servicos_ids.includes(servico.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      servicos_ids: checked 
                        ? [...prev.servicos_ids, servico.id] 
                        : prev.servicos_ids.filter(id => id !== servico.id)
                    }));
                  }}
                  style={{ accentColor: 'var(--color-barber)' }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{servico.nome}</span>
              </label>
            )) : (
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Nenhum serviço cadastrado.</span>
            )}
          </div>
        </div>

        {/* Toggle de Disponibilidade */}
        <div>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
            Disponibilidade
          </label>
          <button
            type="button"
            className={`${drawerStyles.statusToggle} ${formData.ativo ? drawerStyles.active : drawerStyles.inactive}`}
            onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
          >
            {formData.ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            <span>{formData.ativo ? 'Ativo — Trabalhando' : 'Inativo — Afastado'}</span>
          </button>
        </div>

        {/* Justificativa (só aparece ou habilita se inativo) */}
        {!formData.ativo && (
          <Input
            as="textarea"
            label="Justificativa da Inatividade"
            placeholder="Descreva o motivo do afastamento..."
            rows={3}
            value={formData.justificativa}
            onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
            required={!formData.ativo}
          />
        )}
      </form>
      )}
    </Drawer>
  );
};

export default BarberDrawer;
