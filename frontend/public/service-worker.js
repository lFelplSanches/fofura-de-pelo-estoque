self.addEventListener('push', function(event) {
  const data = event.data.json();
  console.log('📢 Notificação recebida:', data);
  
  const options = {
    body: data.body,
    icon: '/icon.png', // Opcional: ícone da notificação
    badge: '/badge.png' // Opcional: badge da notificação
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Redireciona o usuário para a página inicial ao clicar
  );
});
