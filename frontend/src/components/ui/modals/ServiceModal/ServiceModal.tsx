import React, { useState, useEffect } from 'react';
import { createServico, updateServico } from '../../../../api/services';
import { getBarbeiros } from '../../../../api/barbers';
import type { Barbeiro, Servico } from '../../../../types';
import { Tag, DollarSign, Clock, Plus, Users, Edit2 } from 'lucide-react';
import Modal from '../../Modal';
import Input, { cleanCurrency } from '../../Input';
import Button from '../../Button';
import './ServiceModal.css';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  servicoParaEditar?: Servico | null;
}

// # Gabriel (Dev 1)
// Refatorado para usar o Modal genérico e centralizar os estilos de overlay.
const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSuccess, servicoParaEditar }) => {
  const [formData, setFormData] = useState({ nome: '', preco: '', duracao_minutos: '', barbeiro_id: '' });
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (servicoParaEditar) {
        setFormData({
          nome: servicoParaEditar.nome,
          preco: servicoParaEditar.preco.toString(),
          duracao_minutos: servicoParaEditar.duracao_minutos.toString(),
          barbeiro_id: '' // O barbeiro_id não vem no objeto serviço simples, o usuário precisará selecionar ou o back manter
        });
      } else {
        setFormData({ nome: '', preco: '', duracao_minutos: '', barbeiro_id: '' });
      }
      
      const fetchBarbeiros = async () => {
        try {
          const response = await getBarbeiros(1, 100);
          setBarbeiros(response.items || []);
        } catch (err) {
          console.error("Erro ao carregar barbeiros:", err);
        }
      };
      fetchBarbeiros();
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, servicoParaEditar]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        nome: formData.nome,
        preco: cleanCurrency(formData.preco),
        duracao_minutos: parseInt(formData.duracao_minutos),
        barbeiro_id: parseInt(formData.barbeiro_id)
      };

      if (isNaN(payload.preco) || isNaN(payload.duracao_minutos) || (isNaN(payload.barbeiro_id) && !servicoParaEditar)) {
        throw "Dados inválidos ou barbeiro não selecionado.";
      }

      if (servicoParaEditar) {
        // Remove barbeiro_id se não foi alterado para manter o original do back ou se o back não exigir no PATCH
        const updatePayload = { ...payload };
        if (isNaN(payload.barbeiro_id)) delete (updatePayload as any).barbeiro_id;
        
        const successEdit = await updateServico(servicoParaEditar.id, updatePayload);
        if (!successEdit) throw new Error("Erro ao atualizar serviço.");
      } else {
        await createServico(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setFormData({ nome: '', preco: '', duracao_minutos: '', barbeiro_id: '' });
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err || 'Erro ao cadastrar serviço.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={servicoParaEditar ? "Editar Serviço" : "Novo Serviço"}
      variant="green"
      subtitle={servicoParaEditar ? 'Atualize os detalhes do serviço.' : 'Cadastre os detalhes do serviço oferecido.'}
      feedback={success ? {
        type: 'success',
        title: 'Sucesso!',
        message: servicoParaEditar ? 'Serviço atualizado com sucesso.' : 'Serviço criado com sucesso.'
      } : null}
    >

      <div className="modal-body-content">
        <form onSubmit={handleSubmit} className="modern-form">
          <div className="form-group-modern">
            <label>Nome do Serviço</label>
            <Input
              type="text"
              icon={<Tag size={18} />}
              placeholder="Ex: Corte Degradê"
              required
              maxLength={255}
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              autoFocus
            />
          </div>

          <div className="form-group-modern">
            <label>Barbeiro Responsável</label>
            <Input
              as="select"
              icon={<Users size={18} />}
              required
              value={formData.barbeiro_id}
              onChange={(e) => setFormData({ ...formData, barbeiro_id: e.target.value })}
            >
              <option value="">Selecione um barbeiro...</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome} ({b.especialidade})
                </option>
              ))}
            </Input>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group-modern">
              <label>Preço (R$)</label>
              <Input
                mask="currency"
                icon={<DollarSign size={18} />}
                placeholder="0,00"
                required
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              />
            </div>

            <div className="form-group-modern">
              <label>Duração (min)</label>
              <Input
                type="number"
                icon={<Clock size={18} />}
                min="0"
                placeholder="30"
                required
                value={formData.duracao_minutos}
                onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-footer-refined">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              theme="green"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              icon={servicoParaEditar ? <Edit2 size={18} /> : <Plus size={18} />}
            >
              {servicoParaEditar ? 'Salvar Alterações' : 'Criar Serviço'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ServiceModal;
