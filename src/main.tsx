import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';
import { App } from './app';
import { isElectron } from './lib/is-electron';

if (isElectron()) {
  document.documentElement.classList.add('is-electron');
}

const rootElement: HTMLElement | null = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
    <Toaster position="bottom-right" richColors closeButton />
  </StrictMode>,
);
