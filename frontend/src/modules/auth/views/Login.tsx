import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
        <h1 className={styles.authTitle}>Entrar</h1>
        <p className={styles.authSubtitle}>
          Não tem uma conta?{' '}
          <span 
            className={styles.authLink} 
            onClick={() => onNavigate?.('register')}
          >
            Criar conta
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <Input 
          label="Endereço de E-mail"
          type="email" 
          icon={<Mail size={18} />}
          placeholder="seu@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <div style={{ position: 'relative' }}>
          <Input 
            label="Senha"
            type={showPassword ? "text" : "password"} 
            icon={<Lock size={18} />}
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
                  color: 'var(--text-tertiary)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            placeholder="Sua senha" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
          <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
            <span 
              className={styles.clickableText}
              onClick={() => onNavigate?.('forgot-password')}
              style={{ fontSize: '0.8rem', fontWeight: 600, textDecoration: 'underline' }}
            >
              Esqueceu a senha?
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
            background: 'var(--color-client)', 
            color: '#fff', 
            borderRadius: '2rem',
            height: '3.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            marginTop: '1rem'
          }}
        >
          Entrar
        </Button>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button type="button" className={styles.socialButton}>
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" width="18" />
            Google
          </button>
          <button type="button" className={styles.socialButton}>
            <img src="https://www.vectorlogo.zone/logos/facebook/facebook-icon.svg" alt="Facebook" width="18" />
            Facebook
          </button>
        </div>
      </form>

      {/* <div className={styles.devHint} style={{ marginTop: '2rem' }}>
        <p><strong>admin@barba.com</strong> / <strong>cliente@barba.com</strong></p>
      </div> */}
    </div>
  );
};

export default Login;
