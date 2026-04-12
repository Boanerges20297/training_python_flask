import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ui/Toast.tsx' // Gabriel (Dev 1) - Importando o ToastProvider pois o mesmo deve ser onipresente na aplicação

async function prepare() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass', // Ignora requisições de assets (vite, hmr, etc)
    }).then(() => {
      console.log('%c[MSW] Mocking system initialized successfully', 'color: #10b981; font-weight: bold;');
    }).catch((err) => {
      console.error('%c[MSW] Failed to initialize mocking system', 'color: #ef4444; font-weight: bold;', err);
    });
  }
  return Promise.resolve();
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StrictMode>,
  )
})
