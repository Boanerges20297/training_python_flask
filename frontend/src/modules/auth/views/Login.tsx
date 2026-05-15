import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import logoImg from '../../../assets/images/soalogo-removebg-preview.png';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../auth/useAuth';
import { useToast } from '../../../components/ui/Toast';
import styles from './Auth.module.css';

type AuthView = 'login' | 'register' | 'forgot-password';

interface LoginProps {
  onNavigate?: (view: AuthView) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, senha);
      // O AuthContext dispara redirect automaticamente
    } catch (err: unknown) {
      showToast(String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <div className={styles.logoContainer}>
          <img src={logoImg} alt="Logo" className={styles.logoImage} />
        </div>
        <h1 className={styles.authTitle}>Barba & Byte</h1>
        <p className={styles.authSubtitle}>
          Gerenciamento de elite para barbearias modernas
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <Input 
          label="Acesso à Plataforma"
          type="email" 
          icon={<Mail size={18} color="rgba(255,255,255,0.6)" />}
          placeholder="seu@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <div style={{ position: 'relative' }}>
          <Input 
            label="Senha de Segurança"
            type={showPassword ? "text" : "password"} 
            icon={<Lock size={18} color="rgba(255,255,255,0.6)" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  color: 'rgba(255,255,255,0.4)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            placeholder="••••••••" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
            <span 
              className={styles.authLink}
              onClick={() => onNavigate?.('forgot-password')}
              style={{ fontSize: '0.75rem', opacity: 0.8 }}
            >
              Recuperar senha
            </span>
          </div>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          fullWidth 
          isLoading={loading}
          style={{ 
            height: '3.5rem',
            background: 'var(--color-client)',
            fontSize: '1.1rem',
            letterSpacing: '-0.01em'
          }}
        >
          Entrar na Conta
        </Button>

        {/* <div className={styles.divider}>
          <span>Acesso rápido</span>
        </div>

         <p className={styles.footerNote}>
          Não tem uma conta?{' '}
          <span 
            className={styles.authLink} 
            onClick={() => onNavigate?.('register')}
          >
            Cadastre-se agora
          </span>
        </p> */}
      </form>
    </div>
  );
};

export default Login;
