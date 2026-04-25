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
  const [formData, setFormData] = useState({ nome: '', preco: '', duracao_minutos: '', imagem_url: '' });
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (servicoParaEditar) {
        setFormData({
          nome: servicoParaEditar.nome,
          preco: servicoParaEditar.preco.toString(),
          duracao_minutos: servicoParaEditar.duracao_minutos.toString(),
          imagem_url: servicoParaEditar.imagem_url || ''
        });
        setMode('view');
      } else {
        setFormData({ nome: '', preco: '', duracao_minutos: '', imagem_url: '' });
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
        duracao_minutos: parseInt(formData.duracao_minutos),
        imagem_url: formData.imagem_url || undefined
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
      subtitle={mode === 'view' ? 'Catálogo de Serviços' : (servicoParaEditar ? 'Atualize os detalhes do serviço.' : 'Cadastre um novo serviço oferecido.')}
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
          {/* Profile Hero com Imagem */}
          <div className={drawerStyles.bentoProfile}>
            <div 
              className={drawerStyles.bentoAvatar} 
              style={{ 
                background: 'var(--color-service-light)', 
                color: 'var(--color-service)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}
            >
              {servicoParaEditar.imagem_url ? (
                <img 
                  src={servicoParaEditar.imagem_url} 
                  alt={servicoParaEditar.nome} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Briefcase size={28} />
              )}
            </div>
            <div className={drawerStyles.bentoProfileText}>
              <h3>{servicoParaEditar.nome}</h3>
              <p>Serviço ID: #{servicoParaEditar.id}</p>
            </div>
          </div>

          {/* Mini KPI Grid */}
          <div className={drawerStyles.bentoMiniGrid}>
            <div className={drawerStyles.bentoMiniCard}>
              <p>Investimento</p>
              <h2 style={{ color: 'var(--color-success)' }}>
                R$ {Number(servicoParaEditar.preco).toFixed(2).replace('.', ',')}
              </h2>
            </div>
            <div className={drawerStyles.bentoMiniCard}>
              <p>Tempo Médio</p>
              <h2>{servicoParaEditar.duracao_minutos} min</h2>
            </div>
          </div>

          {/* Descrição se houver */}
          {servicoParaEditar.descricao && (
            <div className={drawerStyles.bentoSection}>
              <h4 className={drawerStyles.bentoSectionTitle}>Descrição do Serviço</h4>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                {servicoParaEditar.descricao}
              </p>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '20px', 
              background: 'var(--bg-tertiary)',
              border: '2px dashed var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {formData.imagem_url ? (
                <img src={formData.imagem_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Plus size={32} color="var(--text-tertiary)" style={{ opacity: 0.5 }} />
              )}
            </div>
          </div>

          <Input
            label="URL da Imagem (Opcional)"
            type="text"
            icon={<Plus size={18} />}
            placeholder="https://exemplo.com/foto.jpg"
            value={formData.imagem_url}
            onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
          />

          <Input
            label="Nome do Serviço"
            type="text"
            icon={<Tag size={18} />}
            placeholder="Ex: Corte Degradê"
            required
            maxLength={255}
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
