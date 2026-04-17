import React, { useState } from 'react';
import { Lock, Mail, Scissors, LogIn } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../auth/useAuth';

interface LoginProps {
  onNavigate?: (view: any) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, senha);
      // O App.tsx detectará o estado autenticado via Contexto
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="logo-icon">
          <Scissors size={32} color="#3b82f6" />
        </div>
        <h1>Barba & Byte</h1>
        <p>Acesse sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="modern-form">
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

        {error && <div className="error-message">{error}</div>}

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

      <div className="auth-footer auth-links">
        {onNavigate && (
          <>
            <span onClick={() => onNavigate('forgot-password')} className="clickable-text" style={{ cursor: 'pointer', color: '#94a3b8' }}>
              Esqueceu sua senha?
            </span>
            <span>
              Ainda não tem conta? <a onClick={() => onNavigate('register')}>Criar nova conta</a>
            </span>
          </>
        )}
        <div style={{ marginTop: '1.5rem', opacity: 0.6 }}>
          <p>Dica: <strong>admin@barba.com</strong> → Admin</p>
          <p><strong>cliente@barba.com</strong> → Cliente • <strong>barbeiro@barba.com</strong> → Barbeiro</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

