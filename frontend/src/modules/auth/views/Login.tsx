// Login — Tela de acesso com Glassmorphism e CSS Modules
import React, { useState } from 'react';
import { Lock, Mail, Scissors, LogIn } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../auth/useAuth';
import { useToast } from '../../../components/ui/Toast';
import styles from './Auth.module.css';

interface LoginProps {
  onNavigate?: (view: any) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, senha);
      // O AuthContext dispara redirect automaticamente
    } catch (err: any) {
      showToast(err.toString(), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <div className={`${styles.logoIcon} ${styles.logoBlue}`}>
          <Scissors size={32} color="var(--color-client)" />
        </div>
        <h1 className={styles.authTitle}>Barba & Byte</h1>
        <p className={styles.authSubtitle}>Acesse sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <Input 
          label="E-mail"
          type="email" 
          icon={<Mail size={18} />}
          placeholder="seu@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <Input 
          label="Senha"
          type="password" 
          icon={<Lock size={18} />}
          placeholder="Digite sua senha" 
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <Button 
          type="submit" 
          variant="primary" 
          theme="blue" 
          size="lg" 
          fullWidth 
          isLoading={loading}
          icon={<LogIn size={20} />}
        >
          Entrar no Sistema
        </Button>
      </form>

      <div className={styles.authFooter}>
        {onNavigate && (
          <>
            <span 
              className={styles.clickableText}
              onClick={() => onNavigate('forgot-password')}
            >
              Esqueceu sua senha?
            </span>
            <span>
              Ainda não tem conta?{' '}
              <a 
                className={styles.authLink} 
                onClick={() => onNavigate('register')}
              >
                Criar nova conta
              </a>
            </span>
          </>
        )}
        <div className={styles.devHint}>
          <p>Dica: <strong>admin@barba.com</strong> → Admin</p>
          <p><strong>cliente@barba.com</strong> → Cliente • <strong>barbeiro@barba.com</strong> → Barbeiro</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
