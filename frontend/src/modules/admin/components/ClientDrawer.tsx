// ClientDrawer — Drawer de criação/edição de clientes
import React, { useState, useEffect } from 'react';
import { createCliente, updateCliente } from '../../../api/clients';
import type { Cliente } from '../../../types';
import { User, Phone, Mail, Plus, Edit2, Lock, Users } from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import Input, { cleanPhone } from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import drawerStyles from '../../../components/ui/Drawer.module.css';

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteParaEditar?: Cliente | null;
}

const ClientDrawer: React.FC<ClientDrawerProps> = ({ isOpen, onClose, onSuccess, clienteParaEditar }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', senha: '', observacoes: '' });
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (clienteParaEditar) {
        setFormData({
          nome: clienteParaEditar.nome,
          email: clienteParaEditar.email,
          telefone: clienteParaEditar.telefone,
          senha: '',
          observacoes: clienteParaEditar.observacoes || ''
        });
        setMode('view');
      } else {
        setFormData({ nome: '', email: '', telefone: '', senha: '', observacoes: '' });
        setMode('edit');
      }
    }
  }, [isOpen, clienteParaEditar]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.telefone.replace(/\D/g, "").length < 10) {
      showToast("Insira um telefone válido com DDD.", 'error');
      return;
    }
    if (!isValidEmail(formData.email)) {
      showToast("Insira um e-mail válido.", 'error');
      return;
    }
    if (!clienteParaEditar && !formData.senha) {
      showToast("A senha é obrigatória para cadastro.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (clienteParaEditar) {
        const { senha, ...updateData } = formData;
        const payload = { ...updateData, telefone: cleanPhone(formData.telefone) };
        const success = await updateCliente(clienteParaEditar.id!, payload);
        if (!success) throw new Error("Erro ao atualizar cliente.");
        showToast('Cliente atualizado com sucesso!', 'success');
      } else {
        const payload = { ...formData, telefone: cleanPhone(formData.telefone) };
        await createCliente(payload);
        showToast('Cliente cadastrado com sucesso!', 'success');
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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'view' ? clienteParaEditar?.nome || "Detalhes" : (clienteParaEditar ? "Editar Cliente" : "Novo Cliente")}
      subtitle={mode === 'view' ? "Cliente" : (clienteParaEditar ? "Atualize os dados do cliente." : "Cadastre um novo cliente.")}
      icon={<Users size={20} color="var(--color-client)" />}
      iconBg="var(--color-client-light)"
      iconBorder="var(--color-client-border)"
      footer={
        mode === 'view' ? (
          <>
            <Button
              theme="blue"
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
              theme="blue"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              icon={clienteParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
            >
              {clienteParaEditar ? "Salvar Alterações" : "Cadastrar Cliente"}
            </Button>
            <Button variant="ghost" onClick={() => clienteParaEditar ? setMode('view') : onClose()} disabled={isSubmitting}>
              Cancelar
            </Button>
          </>
        )
      }
    >
      {mode === 'view' && clienteParaEditar ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Profile Hero */}
          <div className={drawerStyles.bentoProfile}>
            <div className={drawerStyles.bentoAvatar} style={{ background: 'var(--color-client-light)', color: 'var(--color-client)' }}>
              {clienteParaEditar.nome.charAt(0).toUpperCase()}
            </div>
            <div className={drawerStyles.bentoProfileText}>
              <h3>{clienteParaEditar.nome}</h3>
              <p>Cliente BarbaByte</p>
            </div>
          </div>

          {/* Sessão de Contato */}
          <div className={drawerStyles.bentoSection}>
            <h4 className={drawerStyles.bentoSectionTitle}>Informações de Contato</h4>
            <div className={drawerStyles.bentoRow}>
              <Mail size={16} color="var(--text-tertiary)" />
              <span>{clienteParaEditar.email}</span>
            </div>
            <div className={drawerStyles.bentoRow}>
              <Phone size={16} color="var(--text-tertiary)" />
              <span>{clienteParaEditar.telefone}</span>
            </div>
          </div>

          {/* Observações Section */}
          {clienteParaEditar.observacoes && (
            <div className={drawerStyles.bentoSection}>
              <h4 className={drawerStyles.bentoSectionTitle}>Observações Internas</h4>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                {clienteParaEditar.observacoes}
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
        <Input
          label="Nome Completo"
          type="text"
          icon={<User size={18} />}
          placeholder="Nome do cliente"
          required
          maxLength={100}
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          autoFocus
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
            placeholder="cliente@email.com"
            required
            maxLength={100}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        {!clienteParaEditar && (
          <Input
            label="Senha"
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

        <Input
          as="textarea"
          label="Observações Internas"
          placeholder="Notas sobre o cliente (ex: restrições, preferências...)"
          rows={4}
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
        />
      </form>
      )}
    </Drawer>
  );
};

export default ClientDrawer;
