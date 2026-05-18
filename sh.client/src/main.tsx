import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './contexts/ToastContext';
import { BookingPolicyProvider } from './contexts/BookingPolicyContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <BookingPolicyProvider>
        <App />
      </BookingPolicyProvider>
    </ToastProvider>
  </StrictMode>,
);
