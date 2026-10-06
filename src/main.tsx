import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { restoreServerSession } from './api/server';
import './stili/osnova.css';
import './stili/maket.css';
import './stili/kartochki.css';
import './stili/formy.css';
import './stili/dom.css';
import './stili/kalendar.css';
import './stili/chat.css';
import './stili/adaptiv.css';
const root = document.getElementById('root');
if (!root) throw new Error('Корневой элемент приложения не найден.');

createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
void restoreServerSession();

if ('serviceWorker' in navigator) {
  const serviceWorker = navigator.serviceWorker;

  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      void serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(error => {
        console.error('Не удалось зарегистрировать service worker', error);
      });
    });
  } else if (typeof serviceWorker.getRegistrations === 'function') {
    void serviceWorker.getRegistrations().then(registrations => Promise.all(
      registrations
        .filter(registration => registration.scope.startsWith(window.location.origin))
        .map(registration => registration.unregister()),
    )).catch(error => {
      console.warn('Не удалось удалить старый service worker', error);
    });
  }
}
