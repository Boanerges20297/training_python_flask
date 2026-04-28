// ServiceDrawer — Drawer de criação/edição de serviços
import React, { useState, useEffect } from 'react';
import { createServico, updateServico } from '../../../api/services';
import type { Servico } from '../../../types';
import { Tag, DollarSign, Clock, Plus, Edit2, Briefcase, History } from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import Input, { cleanCurrency } from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import drawerStyles from '../../../components/ui/Drawer.module.css';
import ImageUpload from '../../../components/ui/ImageUpload';

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
          preco: (servicoParaEditar.preco * 100).toString(),
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
        <div className={drawerStyles.bentoGrid}>
          {/* Card da Foto (Retangular Amplo) */}
          <div className={`${drawerStyles.bentoCard} ${drawerStyles.photoCardWide}`}>
            {servicoParaEditar.imagem_url ? (
              <img 
                src={servicoParaEditar.imagem_url} 
                alt={servicoParaEditar.nome} 
                className={drawerStyles.heroAvatarWide}
              />
            ) : (
              <div className={drawerStyles.heroAvatarWide} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                <Briefcase size={64} color="var(--color-service)" opacity={0.3} />
              </div>
            )}
          </div>

          {/* Card do Nome com ID Flutuante */}
          <div className={`${drawerStyles.bentoCard} ${drawerStyles.nameCard}`} style={{ position: 'relative' }}>
             <span className="badge badge-green badge-corner">ID #{servicoParaEditar.id}</span>
             <span className={drawerStyles.subcardLabel}>Serviço</span>
             <h2>{servicoParaEditar.nome}</h2>
          </div>

          {/* Info Grid (Preço e Tempo em cards separados) */}
          <div className={drawerStyles.bentoContactGroup}>
            <div className={drawerStyles.bentoSubcard}>
              <span className={drawerStyles.subcardLabel}>Preço</span>
              <span className={drawerStyles.subcardValue} style={{ color: 'var(--color-success)', fontWeight: '800', fontSize: '1.25rem' }}>
                R$ {Number(servicoParaEditar.preco).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className={drawerStyles.bentoSubcard}>
              <span className={drawerStyles.subcardLabel}>Tempo Estimado</span>
              <span className={drawerStyles.subcardValue} style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                {servicoParaEditar.duracao_minutos} min
              </span>
            </div>
          </div>

          {/* Descrição se houver */}
          {servicoParaEditar.descricao && (
            <div className={drawerStyles.bentoCard}>
              <span className={drawerStyles.subcardLabel} style={{ marginBottom: '0.75rem', display: 'block' }}>Sobre o Serviço</span>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {servicoParaEditar.descricao}
              </p>
            </div>
          )}

          {/* Seção de Auditoria */}
          <div className={drawerStyles.bentoCard} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} color="var(--text-tertiary)" />
              <span className={drawerStyles.subcardLabel}>Informações do Sistema</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Cadastrado em:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {servicoParaEditar.data_criacao 
                  ? new Date(servicoParaEditar.data_criacao).toLocaleString('pt-BR') 
                  : 'Não disponível'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Atualizado em:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {servicoParaEditar.data_atualizacao 
                  ? new Date(servicoParaEditar.data_atualizacao).toLocaleString('pt-BR') 
                  : 'Nenhuma alteração registrada'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={drawerStyles.drawerForm}>
          <ImageUpload 
            label="Foto do Serviço"
            value={formData.imagem_url}
            onChange={(base64) => setFormData({ ...formData, imagem_url: base64 })}
            helperText="Recomendado: Imagem quadrada, máx 2MB."
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
