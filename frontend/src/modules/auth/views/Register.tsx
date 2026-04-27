// Register — Cadastro com Password Strength Meter e CSS Modules
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

  // Lógica da Senha Forte
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

  // Mapeia nível de força para a classe CSS correta
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
    <div className={`${styles.authCard} ${styles.authCardLarge}`}>
      <div className={styles.authHeader}>
        <h1 className={styles.authTitle}>Criar Conta</h1>
        <p className={styles.authSubtitle}>
          Já tem uma conta?{' '}
          <span
            className={styles.authLink}
            onClick={() => onNavigate?.('login')}
          >
            Entrar
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <div>
          <Input
            label="Nome Completo"
            type="text"
            icon={<User size={18} />}
            placeholder="João Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGrid}>
          <Input
            label="Telefone"
            type="text"
            mask="phone"
            icon={<Phone size={18} />}
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            required
          />

          <Input
            label="Endereço de E-mail"
            type="email"
            icon={<Mail size={18} />}
            placeholder="joaosilva@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

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

        {/* Password Strength Meter */}
        <div className={styles.strengthContainer} style={{ marginTop: '0.5rem' }}>
          <div className={styles.strengthBars}>
            <div className={`${styles.strengthBar} ${getStrengthClass(1)}`} />
            <div className={`${styles.strengthBar} ${getStrengthClass(2)}`} />
            <div className={`${styles.strengthBar} ${getStrengthClass(3)}`} />
            <div className={`${styles.strengthBar} ${getStrengthClass(4)}`} />
          </div>
          <span className={styles.strengthLabel}>Força: {strengthLabels[strength]}</span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          style={{
            background: 'var(--color-service)',
            color: '#fff',
            borderRadius: '2rem',
            height: '3.5rem',
            fontSize: '1rem',
            fontWeight: 600,
            marginTop: '1.5rem',
            boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)'
          }}
        >
          Criar Conta
        </Button>

        {/* Checkbox reposicionado abaixo do botão */}
        <label className={styles.checkboxContainer}>
          <input type="checkbox" required />
          <div className={styles.customCheckbox} />
          <span className={styles.checkboxLabel}>
            Concordo com os <strong>Termos e Condições</strong>
          </span>
        </label>

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
    </div>
  );
};

export default Register;
