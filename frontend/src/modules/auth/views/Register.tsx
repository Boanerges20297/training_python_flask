// Register — Cadastro com Password Strength Meter e CSS Modules
import React, { useState } from 'react';
import { User, Lock, Mail, Phone, UserPlus, ArrowLeft } from 'lucide-react';
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
  const [confirmSenha, setConfirmSenha] = useState('');
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
    if (senha !== confirmSenha) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    
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
        <div className={`${styles.logoIcon} ${styles.logoGreen}`}>
          <UserPlus size={32} color="var(--color-service)" />
        </div>
        <h1 className={styles.authTitle}>Criar Conta</h1>
        <p className={styles.authSubtitle}>Junte-se à Barba & Byte agora mesmo</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.authForm}>
        <div className={styles.inputGrid}>
          <Input 
            label="Nome"
            type="text" 
            icon={<User size={18} />}
            placeholder="Seu nome" 
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          
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
        </div>
        
        <Input 
          label="E-mail"
          type="email" 
          icon={<Mail size={18} />}
          placeholder="seu@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className={styles.inputGrid}>
          <Input 
            label="Senha"
            type="password" 
            icon={<Lock size={18} />}
            placeholder="Senha" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <Input 
            label="Confirmar"
            type="password" 
            icon={<Lock size={18} />}
            placeholder="Repita" 
            value={confirmSenha}
            onChange={(e) => setConfirmSenha(e.target.value)}
            required
          />
        </div>

        {/* Password Strength Meter */}
        <div className={styles.strengthContainer}>
          <div className={styles.strengthBars}>
            <div className={`${styles.strengthBar} ${getStrengthClass(1)}`} />
            <div className={`${styles.strengthBar} ${getStrengthClass(2)}`} />
            <div className={`${styles.strengthBar} ${getStrengthClass(3)}`} />
            <div className={`${styles.strengthBar} ${getStrengthClass(4)}`} />
          </div>
          <span className={styles.strengthLabel}>Força: {strengthLabels[strength]}</span>
        </div>

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
            theme="green" 
            isLoading={loading}
            icon={<UserPlus size={18} />}
          >
            Cadastrar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Register;
