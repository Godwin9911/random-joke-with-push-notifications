self.addEventListener('notificationclose', event => {
    const notification = event.notification;
    const primaryKey = notification.data.primaryKey;

    console.log('Closed notification: ' + primaryKey);
  });

self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const primaryKey = notification.data.primaryKey;
    const action = event.action;

    if (action === 'close') {
      notification.close();
    } else {
      clients.openWindow('/');
      notification.close();
    }

    // TODO 5.3 - close all notifications when one is clicked

  });

self.addEventListener('push', event => {
    const data = event.data.json();
    let body;

    if (data) {
      body =  data.body;
    } else {
      body = 'Default body';
    }

    const options = {
      body,
      icon: 'images/notification-flat.png',
      requireInteraction: true,
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {action: 'explore', title: 'Go to the site'},
        {action: 'close', title: 'Close'},
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
