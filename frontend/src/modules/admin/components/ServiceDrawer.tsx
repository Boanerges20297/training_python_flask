// ServiceDrawer — Drawer de criação/edição de serviços
import React, { useState, useEffect } from 'react';
import { createServico, updateServico } from '../../../api/services';
import type { Servico } from '../../../types';
import { Tag, DollarSign, Clock, Plus, Edit2, Briefcase } from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import Input, { cleanCurrency } from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import drawerStyles from '../../../components/ui/Drawer.module.css';

interface ServiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  servicoParaEditar?: Servico | null;
}

const ServiceDrawer: React.FC<ServiceDrawerProps> = ({ isOpen, onClose, onSuccess, servicoParaEditar }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ nome: '', preco: '', duracao_minutos: '' });
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (servicoParaEditar) {
        setFormData({
          nome: servicoParaEditar.nome,
          preco: servicoParaEditar.preco.toString(),
          duracao_minutos: servicoParaEditar.duracao_minutos.toString(),
        });
        setMode('view');
      } else {
        setFormData({ nome: '', preco: '', duracao_minutos: '' });
        setMode('edit');
      }
    }
  }, [isOpen, servicoParaEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        nome: formData.nome,
        preco: cleanCurrency(formData.preco),
        duracao_minutos: parseInt(formData.duracao_minutos)
      };

      if (isNaN(payload.preco) || isNaN(payload.duracao_minutos)) {
        throw "Dados inválidos.";
      }

      if (servicoParaEditar) {
        const updatePayload = { ...payload };
        const success = await updateServico(servicoParaEditar.id, updatePayload);
        if (!success) throw new Error("Erro ao atualizar serviço.");
        showToast('Serviço atualizado com sucesso!', 'success');
      } else {
        await createServico(payload);
        showToast('Serviço criado com sucesso!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err || 'Erro ao processar serviço.';
      showToast(String(msg), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'view' ? servicoParaEditar?.nome || "Detalhes" : (servicoParaEditar ? "Editar Serviço" : "Novo Serviço")}
      subtitle={mode === 'view' ? 'Serviço' : (servicoParaEditar ? 'Atualize os detalhes do serviço.' : 'Cadastre um novo serviço oferecido.')}
      icon={<Briefcase size={20} color="var(--color-service)" />}
      iconBg="var(--color-service-light)"
      iconBorder="var(--color-service-border)"
      footer={
        mode === 'view' ? (
          <>
            <Button
              theme="green"
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
              theme="green"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              icon={servicoParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
            >
              {servicoParaEditar ? "Salvar Alterações" : "Criar Serviço"}
            </Button>
            <Button variant="ghost" onClick={() => servicoParaEditar ? setMode('view') : onClose()} disabled={isSubmitting}>
              Cancelar
            </Button>
          </>
        )
      }
    >
      {mode === 'view' && servicoParaEditar ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header Bento */}
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
              background: 'var(--color-service-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-service)'
            }}>
              <Briefcase size={32} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{servicoParaEditar.nome}</h3>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Serviço do Catálogo</p>
            </div>
          </div>

          {/* Details Bento */}
          <div style={{ 
            background: 'var(--bg-secondary)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Detalhes do Serviço</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <DollarSign size={20} color="var(--color-green)" />
                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Preço</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 'bold' }}>
                    R$ {Number(servicoParaEditar.preco).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={20} color="var(--color-amber)" />
                <div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Duração Estimada</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 'bold' }}>
                    {servicoParaEditar.duracao_minutos} min
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
        <Input
          label="Nome do Serviço"
          type="text"
          icon={<Tag size={18} />}
          placeholder="Ex: Corte Degradê"
          required
          maxLength={255}
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          autoFocus
        />

        <div className={drawerStyles.drawerGrid}>
          <Input
            label="Preço (R$)"
            mask="currency"
            icon={<DollarSign size={18} />}
            placeholder="0,00"
            required
            value={formData.preco}
            onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
          />
          <Input
            label="Duração (min)"
            type="number"
            icon={<Clock size={18} />}
            min="0"
            placeholder="30"
            required
            value={formData.duracao_minutos}
            onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
          />
        </div>
      </form>
      )}
    </Drawer>
  );
};

export default ServiceDrawer;
