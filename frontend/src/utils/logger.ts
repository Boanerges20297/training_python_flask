// felipe
// verificar se está em modo de desenvolvimento
const isDev = import.meta.env.DEV;

// definir os niveis possíveis como um tipo TypeScript
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// mapear os níveis por cores
const LEVEL_STYLES: Record<LogLevel, string> = {
  DEBUG: 'color: #94a3b8; font-weight: normal',   // Cinza — informação de baixo nível
  INFO:  'color: #60a5fa; font-weight: bold',      // Azul — fluxo normal da aplicação
  WARN:  'color: #f59e0b; font-weight: bold',      // Amarelo — algo merece atenção
  ERROR: 'color: #ef4444; font-weight: bold',      // Vermelho — falha real
};

// a função que todos os outros métodos vão usar internamente
function log(level: LogLevel, namespace: string, message: string, ...data: unknown[]) {
  if (!isDev) return;

  // formata a hora atual
  const time = new Date().toLocaleTimeString('pt-BR');

  // monta o prefixo visual
  const prefix = `%c[${time}] [${namespace.toUpperCase()}] [${level}]`;

  // escolhe o método nativo do console correspondente ao nível
  const consoleFn = level === 'ERROR' ? console.error
                  : level === 'WARN'  ? console.warn
                  : console.log;

  // se existirem dados extras (objetos, arrays), mostra com groupCollapsed
  if (data.length > 0) {
    consoleFn(prefix, LEVEL_STYLES[level], message);
    console.groupCollapsed('  → dados');
    console.dir(data.length === 1 ? data[0] : data);
    console.groupEnd();
  } else {
    consoleFn(prefix, LEVEL_STYLES[level], message);
  }
}

// retorna um objeto com os 4 métodos tipados
export function createLogger(namespace: string) {
  return {
    debug: (message: string, ...data: unknown[]) => log('DEBUG', namespace, message, ...data),
    info:  (message: string, ...data: unknown[]) => log('INFO',  namespace, message, ...data),
    warn:  (message: string, ...data: unknown[]) => log('WARN',  namespace, message, ...data),
    error: (message: string, ...data: unknown[]) => log('ERROR', namespace, message, ...data),
  };
}

// cada módulo cria o seu logger: import { createLogger } from '../utils/logger'
// exemplo de uso: const logger = createLogger('auth');
