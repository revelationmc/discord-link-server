const config = require('../config.json');

const mariadb = require('mariadb');

const pool = mariadb.createPool({
    connectionLimit: 10,
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.username,
    password: config.password
});

pool.query('CREATE TABLE IF NOT EXISTS discord_link_data (minecraftId VARCHAR(36) PRIMARY KEY NOT NULL , discordId TEXT NOT NULL);')
    .finally(() => {
        console.log('Successfully connected to SQL database.')
    });

pool.query('CREATE TABLE IF NOT EXISTS discord_link_api_keys (apiKey VARCHAR(36) PRIMARY KEY NOT NULL, serverName TEXT);');

module.exports = pool;