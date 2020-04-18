if (process.env.NODE_ENV !== 'development') {
  require('dotenv').config();
}
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const webpush = require('web-push');
const Push = require('./models/Push');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

const port = process.env.PORT || 8081

// This serves static files from the specified directory
app.use(express.static('client'));

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// DB Config
const db = require('./config/keys').mongoURI;
// Connect to MongoDB
mongoose.connect(db,{ useNewUrlParser: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const vapidKeys = {
  publicKey:'BCNNznuY_EpOBoC5C3Al7G80bKZeiCwYZVZZopfFdE3m6rRgSUUZbzT7r3zQ3g91zxIo07_3Ocnm6SfwLS3rcnU',
  privateKey: process.env.PRIVATE_KEY
};

var todaysJoke = [];

webpush.setVapidDetails(
  'mailto:example@email.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

function getjoke(res){
  const url = "https://icanhazdadjoke.com/";
  const options = { 
  method: 'GET',
  headers: {
    "Accept" : "application/json" 
  }
}; 
fetch(url, options).then(res =>  res.json())
  .then(data => {
    res.send(data)
    return data.joke;
  })
  .catch(err => console.log(err))
}

app.post('/api/save-subscription', (req, res) => {
  const subscription = req.body;
  const push = new Push({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }
  });

  push.save(function (err, push) {
    if (err) {
      console.error('error with subscribe', error);
      res.status(500).send('subscription not possible');
      return;
    }

    const payload = JSON.stringify({
      title: 'Welcome',
      body: 'Thank you for enabling push notifications, jokes will be sent to you Everyday',
    });

    const options = {
      TTL: 86400
    };

    const subscription = {
      endpoint: push.endpoint,
      keys: {
        p256dh: push.keys.p256dh,
        auth: push.keys.auth
      }
    };

    webpush.sendNotification(
      subscription,
      payload,
      options
      ).then(function() {
        console.log("Send welcome push notification");
      }).catch(err => {
        console.error("Unable to send welcome push notification", err );
    });
    res.status(200).send('subscribe');
    return;
  });

})

app.post('/api/send-notification', (req, res) => {
  const triggerPush = (subscription, dataToSend) => {
    return webpush.sendNotification(subscription, dataToSend)
    .catch((err) => {
      if (err.statusCode === 410) {
        return Push.deleteOne({endpoint: subscription.endpoint}, function (err,data){
          if(err) {
            console.error('error with unsubscribe', error);
            res.status(500).send('unsubscription not possible');
          }
          console.log('unsubscribed');
        });
      } else {
        console.log('Subscription is no longer valid: ', err)
      }
    })
  }
  const payload = JSON.stringify({
    title: 'Todays Joke',
    data: req.body.joke
  });
  return Push.find().then((subscriptions) =>{
    let promiseChain = Promise.resolve()
    for (let i = 0; i < subscriptions.length; i++) {

      const subscription = subscriptions[i]
      promiseChain = promiseChain.then(() => {
        return triggerPush(subscription, payload)
      })
    }
    return promiseChain
  })
  .then(() => {
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify({ data: { success: true } }))
  })
  .catch((err) => {
    res.status(500)
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify({
      error: {id: 'unable-to-send-messages',message: `Failed to send the push ${err.message}`}
    }))
  })
})

app.post('/api/unsubscribe-notification', (req, res) => {
  const endpoint = req.body.endpoint;

  Push.findOneAndRemove({endpoint: endpoint}, function (err,data){
    if(err) {
      console.error('error with unsubscribe', error);
      res.status(500).send('unsubscription not possible');
    }
    console.log('unsubscribed');
    res.status(200).send('unsubscribe');
  });
})

app.get('/api/get-joke', (req, res) => {
  return getjoke(res);
});


const server = app.listen(port, () => {

  const host = server.address().address;
  const port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
