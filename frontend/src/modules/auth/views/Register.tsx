import React, { useState } from 'react';
import { User, Lock, Mail, UserPlus, ArrowLeft } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../auth/useAuth';

interface RegisterProps {
  onRegisterSuccess?: (user: any) => void;
  onNavigate: (view: any) => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Strength Logic
  const calcStrength = (pw: string) => {
    let score = 0;
    if (!pw) return score;
    if (pw.length > 5) score += 1;
    if (pw.length > 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pw)) score += 1;
    return Math.min(4, score);
  };
  
  const strength = calcStrength(senha);
  const strengthLabels = ['Muito Fraca', 'Fraca', 'Razoável', 'Forte', 'Muito Forte'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== confirmSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await register(nome, email, senha);
      // O App.tsx detectará o estado autenticado via Contexto
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card large">
      <div className="auth-header">
        <div className="logo-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <UserPlus size={32} color="#10b981" />
        </div>
        <h1>Criar Conta</h1>
        <p>Junte-se à Barba & Byte agora mesmo</p>
      </div>

      <form onSubmit={handleSubmit} className="modern-form">
        <Input 
          label="Nome Completo"
          type="text" 
          icon={<User size={18} />}
          placeholder="Seu nome completo" 
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        
        <Input 
          label="E-mail"
          type="email" 
          icon={<Mail size={18} />}
          placeholder="seu@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div style={{ position: 'relative' }}>
          <Input 
            label="Senha"
            type="password" 
            icon={<Lock size={18} />}
            placeholder="Crie uma senha forte" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        
        <div className="password-strength-container">
          <div className="password-strength-bars">
            <div className={`pw-bar ${strength >= 1 ? 'active-1' : ''}`} />
            <div className={`pw-bar ${strength >= 2 ? `active-${strength}` : ''}`} />
            <div className={`pw-bar ${strength >= 3 ? `active-${strength}` : ''}`} />
            <div className={`pw-bar ${strength >= 4 ? `active-4` : ''}`} />
          </div>
          <span className="password-strength-label">Força: {strengthLabels[strength]}</span>
        </div>

        <Input 
          label="Confirmar Senha"
          type="password" 
          icon={<Lock size={18} />}
          placeholder="Repita sua senha" 
          value={confirmSenha}
          onChange={(e) => setConfirmSenha(e.target.value)}
          required
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
            theme="green" 
            isLoading={loading}
            icon={<UserPlus size={18} />}
          >
            Finalizar Cadastro
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Register;
