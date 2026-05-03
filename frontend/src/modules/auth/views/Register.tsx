import React, { useState } from 'react';
import { User, Lock, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../auth/useAuth';
import { useToast } from '../../../components/ui/Toast';
import styles from './Auth.module.css';

interface RegisterProps {
  onRegisterSuccess?: (user: any) => void;
  onNavigate: (view: any) => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const calcStrength = (pw: string) => {
    if (pw.length < 6) return 0;
    let score = 1;
    if (pw.length > 10) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pw)) score += 1;
    return Math.min(4, score);
  };

  const strength = calcStrength(senha);
  const strengthLabels = ['Muito Fraca', 'Fraca', 'Razoável', 'Forte', 'Muito Forte'];

  const getStrengthClass = (barIndex: number) => {
    if (strength >= barIndex) {
      const classMap: Record<number, string> = {
        1: styles.strength1,
        2: styles.strength2,
        3: styles.strength3,
        4: styles.strength4,
      };
      return classMap[strength] || '';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(nome, email, senha, telefone);
      showToast('Conta criada com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.toString(), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <h1 className={styles.authTitle}>Criar Conta</h1>
        <p className={styles.authSubtitle}>
          Junte-se à elite da Barba & Byte
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <Input
          label="Nome Completo"
          type="text"
          icon={<User size={18} color="rgba(255,255,255,0.6)" />}
          placeholder="João Silva"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

        <div className={styles.inputGrid}>
          <Input
            label="Telefone"
            type="text"
            mask="phone"
            icon={<Phone size={18} color="rgba(255,255,255,0.6)" />}
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />

          <Input
            label="E-mail"
            type="email"
            icon={<Mail size={18} color="rgba(255,255,255,0.6)" />}
            placeholder="joao@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <Input
            label="Senha"
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

          <div className={styles.strengthContainer} style={{ marginTop: '0.75rem' }}>
            <div className={styles.strengthBars}>
              <div className={`${styles.strengthBar} ${getStrengthClass(1)}`} />
              <div className={`${styles.strengthBar} ${getStrengthClass(2)}`} />
              <div className={`${styles.strengthBar} ${getStrengthClass(3)}`} />
              <div className={`${styles.strengthBar} ${getStrengthClass(4)}`} />
            </div>
            <span className={styles.strengthLabel} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
              Segurança: {strengthLabels[strength]}
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
            boxShadow: '0 10px 20px -5px rgba(var(--color-client-rgb), 0.4)',
            fontSize: '1.1rem',
            marginTop: '0.5rem'
          }}
        >
          Finalizar Cadastro
        </Button>

        <p className={styles.footerNote}>
          Já possui conta?{' '}
          <span
            className={styles.authLink}
            onClick={() => onNavigate?.('login')}
          >
            Entrar agora
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
