// ForgotPassword — Recuperação de senha com CSS Modules e Toast
import React, { useState } from 'react';
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../auth/useAuth';
import { useToast } from '../../../components/ui/Toast';
import styles from './Auth.module.css';

interface ForgotPasswordProps {
  onNavigate: (view: any) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
      showToast('Link de recuperação enviado!', 'success');
    } catch (err: any) {
      showToast(err.toString(), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <div className={`${styles.logoIcon} ${styles.logoAmber}`}>
          <KeyRound size={32} color="var(--color-barber)" />
        </div>
        <h1 className={styles.authTitle}>Esqueci a Senha</h1>
        <p className={styles.authSubtitle}>Recupere o acesso à sua conta</p>
      </div>

      {success ? (
        <div className={styles.successState}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={48} color="var(--color-success)" />
          </div>
          <h3 className={styles.successTitle}>E-mail Enviado!</h3>
          <p className={styles.successDescription}>
            Se o endereço <strong>{email}</strong> estiver cadastrado em nossa base, 
            você receberá um link para redefinir sua senha em instantes.
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
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <p className={styles.formDescription}>
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

          <div className={styles.formButtons}>
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
