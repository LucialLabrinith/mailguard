import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Synchronous initial theme application to avoid any visual lag
try {
  const savedTheme = localStorage.getItem('mailguard_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-audit');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.remove('light-audit');
    document.documentElement.classList.add('dark');
  }
} catch {
  // Ignore in SSR / restricted environments
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
