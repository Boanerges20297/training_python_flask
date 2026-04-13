import React, { useState } from 'react';
import { Lock, Mail, Scissors, LogIn } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../auth/useAuth';

// felipe
// Login não recebe mais props — o contexto cuida do estado de autenticação
const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // felipe
  // delega o login ao AuthContext — sem sessionStorage manual aqui
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, senha);
      // App.tsx detecta isAuthenticated via contexto e exibe o painel
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
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

        <div className="login-footer">
          <p>Dica: Use <strong>admin@barba.com</strong> / <strong>admin123</strong></p>
        </div>
      </div>

      <style>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%);
          overflow: hidden;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-icon {
          background: rgba(59, 130, 246, 0.1);
          width: 64px;
          height: 64px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .login-header h1 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .input-group input {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          color: white;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .input-group input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(15, 23, 42, 0.9);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .login-btn {
          width: 100%;
          margin-top: 1rem;
          height: 3rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(239, 68, 68, 0.2);
          text-align: center;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.8rem;
          color: #475569;
        }

        .login-footer strong {
          color: #64748b;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
