const mariadb = require('./mariadb_utils');
const redis = require("./redis_utils");

async function verifyApiKey(apiKey) {
    if (!apiKey) {
        return false;
    }
    const notExists = await redis.exists('api-key:' + apiKey).then(exists => !exists);
    if (notExists) {
        const response = await mariadb.query('SELECT * FROM discord_link_api_keys WHERE apiKey = ?;', [apiKey]);
        console.log(response);
        if (!response[0]) {
            return false;
        }
        await redis.set('api-key:' + response[0].apiKey, response[0].serverName, {EX: 60 * 30});
    }
    return await redis.exists('api-key:' + apiKey);
}

module.exports = {verifyApiKey}
