const redis = require('redis');

const client = redis.createClient();

client.on('error', error => {
    console.error(error);
});

client.connect()
    .finally(() => {
        console.log('Successfully connected to Redis database!');
    });

client.configSet('notify-keyspace-events', 'Ex');

const subscriber = client.duplicate();
subscriber.connect()
    .finally(() => {
        console.log('Subscriber successfully connected!');
    });

subscriber.subscribe('__keyevent@0__:expired', message => {
    const type = message.toString().split(':')[0];
    const id = message.toString().split(':')[1];

    if (type === 'verification') {
        console.log('Verification process for ' + message + ' expired.');
    }

    if (type === 'minecraft' || type === 'discord') {
        console.log('Cached id for ' + id + ' expired.');
    }
})

module.exports = client;
