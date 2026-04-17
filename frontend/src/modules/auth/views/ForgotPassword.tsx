import React, { useState } from 'react';
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../auth/useAuth';

interface ForgotPasswordProps {
  onNavigate: (view: any) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header" style={{ marginBottom: success ? '1.5rem' : '2.5rem' }}>
        <div className="logo-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
          <KeyRound size={32} color="#f59e0b" />
        </div>
        <h1>Esqueci a Senha</h1>
        <p>Recupere o acesso à sua conta</p>
      </div>

      {success ? (
        <div className="success-state" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 size={48} color="#10b981" />
          </div>
          <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>E-mail Enviado!</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            Se o endereço <strong>{email}</strong> estiver cadastrado em nossa base, você receberá um link para redefinir sua senha em instantes.
          </p>
          <Button 
            variant="primary" 
            theme="blue" 
            fullWidth 
            onClick={() => onNavigate('login')}
          >
            Voltar para o Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="modern-form">
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Digite o e-mail associado à sua conta. Enviaremos as instruções para você.
          </p>
          
          <Input 
            label="E-mail Cadastrado"
            type="email" 
            icon={<Mail size={18} />}
            placeholder="seu@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          {error && <div className="error-message">{error}</div>}

          <div className="auth-form-buttons">
            <Button 
              variant="ghost" 
              type="button"
              icon={<ArrowLeft size={18} />}
              onClick={() => onNavigate('login')}
            >
              Voltar
            </Button>
            
            <Button 
              type="submit" 
              theme="amber" 
              isLoading={loading}
              icon={<KeyRound size={18} />}
            >
              Enviar Link
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
