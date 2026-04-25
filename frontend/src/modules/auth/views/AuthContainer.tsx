// AuthContainer — Com animação de Swap (Framer Motion) e Theme Toggle
import React, { useState, useRef } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { Navigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import authBgLogin from '../../../assets/images/auth-bg.png';
import authBgRegister from '../../../assets/images/auth-register-bg.png'; 
import styles from './Auth.module.css';

interface AuthContainerProps {}

type AuthView = 'login' | 'register' | 'forgot-password';

const AuthContainer: React.FC<AuthContainerProps> = () => {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const constraintsRef = useRef(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Define se o formulário deve estar na esquerda ou direita
  // Login e ForgotPassword na direita (padrão), Register na esquerda (swap)
  // Define o tema de cores baseado na view
  const theme = currentView === 'register' ? 'registerTheme' : currentView === 'login' ? 'loginTheme' : 'forgotPasswordTheme';
  const isReversed = currentView === 'register';

  // Lógica para trocar a imagem dependendo da view
  const currentImage = currentView === 'register' ? authBgRegister : authBgLogin;

  const renderView = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.15, // Mais rápido para evitar rastro
            ease: "easeOut" 
          }}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          {currentView === 'login' && (
            <Login onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
          {currentView === 'register' && (
            <Register onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
          {currentView === 'forgot-password' && (
            <ForgotPassword onNavigate={(view: AuthView) => setCurrentView(view)} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div 
      className={`${styles.authContainer} ${styles[theme]}`} 
      ref={constraintsRef}
    >
      {/* ── Seletor de Tema Arrastável (UX Fun factor) ── */}
      <motion.div 
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        // Lógica para atrair para os cantos ao soltar
        dragTransition={{
          power: 0.3,
          modifyTarget: (target) => {
            // Define o "imã" para os cantos (aproximadamente 0 ou limites da tela)
            // Se o alvo final for maior que a metade da tela, joga para o canto direito/inferior
            const snapX = target > window.innerWidth / 2 ? window.innerWidth - 80 : 20;
            return snapX; // Você pode aplicar lógica similar para o 'y' se desejar
          }
        }}
        whileHover={{ scale: 1 }}
        whileTap={{ scale: 0.9, cursor: 'grabbing' }}
        className={styles.themeToggleWrapper}
        style={{ cursor: 'grab', position: 'absolute', zIndex: 1000 }}
      >
        <ThemeToggle />
      </motion.div>

      <div 
        className={`${styles.contentBox} ${isReversed ? styles.reversed : ''}`}
      >
        {/* ── Painel de Hero (60%) ── */}
        <motion.div 
          layout
          className={styles.heroPanel}
          initial={false}
          animate={{ 
            zIndex: 10, // Sempre acima para cobrir o rastro do formulário durante o swap
            scale: 1
          }}
          transition={{ 
            type: "spring", 
            stiffness: 120, 
            damping: 22
          }}
        >
          <motion.img 
            key={currentImage}
            src={currentImage} 
            alt="Barba & Byte Concept" 
            className={styles.heroImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
          <div className={styles.heroOverlay}>
            <div className={styles.heroBrand}>
              <div className={styles.heroBrandIcon}>
                <Scissors size={24} color="var(--color-client)" />
              </div>
              <span className={styles.heroBrandText}>Barba & Byte</span>
            </div>
            <motion.p 
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.heroTagline}
            >
              {currentView === 'register' 
                ? "Crie sua conta e agende seu estilo em segundos. A tecnologia que sua barba merece."
                : currentView === 'login' ? "Seu estilo, nossa tecnologia. Acesse a plataforma e gerencie seus agendamentos."
                : "Recupere sua senha com segurança e agilidade, volte a cuidar do seu visual em instantes."
              }
            </motion.p>
          </div>
        </motion.div>

        {/* ── Painel de Formulário (40%) ── */}
        <motion.div 
          layout
          className={styles.formPanel}
          initial={false}
          animate={{ 
            zIndex: 1, // Sempre abaixo para ser coberto pela imagem durante o swap
          }}
          transition={{ 
            type: "spring", 
            stiffness: 120, 
            damping: 22
          }}
        >
          {renderView()}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthContainer;
