import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration);

          return registration.pushManager.getSubscription()
            .then(subscription => {
              if (subscription) return subscription;

              const VAPID_PUBLIC_KEY = 'BPBoEj2dWqS5X8ZFXONejTAEL7o9CPNO_EzJaGSjMuQs8KWhntkaKvbjYHhG98IJd62eHNoKAQl0hdJinpLS4ik'; // Substitua pela chave pública VAPID
              const convertedKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

              return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey
              });
            });
        })
        .then(subscription => {
          return fetch('/api/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' }
          });
        })
        .catch(err => console.error('Erro ao registrar o Service Worker ou inscrever-se:', err));
    }
  }, []);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return (
    <div className="App">
      <h1>Fofura de Pelo - Controle de Estoque</h1>
    </div>
  );
}

export default App;
