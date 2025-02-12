self.addEventListener('push', function(event) {
  if (event.data) {
    console.log('Push event com dados:', event.data.text());
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/logo192.png',  // Altere para o caminho correto do ícone
      badge: '/logo192.png',
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } else {
    console.log('Push event recebido sem dados.');
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notificação clicada:', event.notification);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
