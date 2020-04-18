const app = (() => {
    'use strict';
  
    let isSubscribed = false;
    let swRegistration = null;
  
    //const notifyButton = document.querySelector('.js-notify-btn');
    const pushButton = document.querySelector('.js-push-btn');
  
    //check for notification support
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications!');
      return;
    }
  
    function initializeUI() {
      // TODO 3.3b - add a click event listener to the "Enable Push" button
      // and get the subscription object
      pushButton.addEventListener('click', () => {
        pushButton.disabled = true;
        if (isSubscribed) {
          unsubscribeUser();
        } else {
          subscribeUser();
        }
      });
      
      swRegistration.pushManager.getSubscription()
      .then(subscription => {
        isSubscribed = (subscription !== null);
        if (isSubscribed) {
          console.log('User IS subscribed.');
        } else {
          console.log('User is NOT subscribed.');
        }
        updateBtn();
      });
  
    }
  
    function subscribeUser() {
      const applicationServerKey = urlB64ToUint8Array('BCNNznuY_EpOBoC5C3Al7G80bKZeiCwYZVZZopfFdE3m6rRgSUUZbzT7r3zQ3g91zxIo07_3Ocnm6SfwLS3rcnU');
      
      swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      })
      .then(subscription => {
        console.log('User is subscribed:', subscription);
  
        updateSubscriptionOnServer(subscription); 
  
        isSubscribed = true;
  
        updateBtn();
      })
      .catch(err => {
        if (Notification.permission === 'denied') {
          console.warn('Permission for Joke notifications was denied');
        } else {
          console.error('Failed to subscribe the user: ', err);
        }
        updateBtn();
      });
    }
  
    function unsubscribeUser() {
  
      //unsubscribe from the push service
      swRegistration.pushManager.getSubscription()
        .then(subscription => {
          if (subscription) {
            //TODO unsubscribe on server
            return subscription.unsubscribe();
          }
        })
        .catch(err => {
          console.log('Error unsubscribing', err);
        })
        .then(() => {
          //updateSubscriptionOnServer(null);
          console.log('User is unsubscribed');
          isSubscribed = false;
          updateBtn();
        });
  
    }
  
    function updateBtn() {
      if (Notification.permission === 'denied') {
        pushButton.innerHTML = '<i class="far fa-bell"></i> Push Notifications Blocked';
        pushButton.disabled = true;
        updateSubscriptionOnServer(null);
        return;
      }
  
      if (isSubscribed) {
        pushButton.innerHTML = '<i class="far fa-bell-slash"></i> Disable Push Notifications';
      } else {
        pushButton.innerHTML = '<i class="far fa-bell"></i> Enable Push Notifications';
      }
  
      pushButton.disabled = false;
    }
  
    function urlB64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
  
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
  
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
  
    /*notifyButton.addEventListener('click', () => {
      displayNotification();
    });*/
  
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        console.log('Service Worker and Push is supported');
  
        navigator.serviceWorker.register('swjoke.js')
        .then(swReg => {
          console.log('Service Worker is registered', swReg);
  
          swRegistration = swReg;
          
          //call the initializeUI() function
          initializeUI();
          getjoke();
        })
        .catch(err => {
          console.error('Service Worker Error', err);
        });
      });
    } else {
      console.warn('Push messaging is not supported');
      pushButton.textContent = 'Push Not Supported';
    }
  
  })();
  
  function updateSubscriptionOnServer(subscription) {
    // Here's where you would send the subscription to the application server
    if (subscription) {
      //send to backend
      fetch('/api/save-subscription/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        })
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Bad status code from server.');
          }
      
          return response.json();
        })
        .then(function(responseData) {
          if (!(responseData.data && responseData.data.success)) {
            throw new Error('Bad response from server.');
          }
        });
  
    } else {
      console.log('err')
    }
  }
  const generate = document.querySelector('#generate'),
        joke = document.querySelector('#joke');

  const getjoke = _ => {
    joke.innerHTML = 'Loading...'
    fetch('/api/get-joke/')
      .then(res => res.json())
      .then(data => {
        joke.innerHTML = data.joke
      })
      .catch(err => console.log('Erorr in recieving Joke', err))
  }
  generate.addEventListener('click', getjoke);
   