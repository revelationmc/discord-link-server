const express = require('express');
const router = express.Router();

const mariadb = require('../utils/mariadb_utils');
const redis = require('../utils/redis_utils');

const security = require("../utils/security_utils");

router.post('/', async (req, res) => {
    const apiKey = req.header('API-Key');

    if (!await security.verifyApiKey(apiKey)) {
        res.status(400).json({
            success: false, error: 'Invalid API key.'
        });
        return;
    }

    const verificationCode = req.body.code;

    if (!verificationCode) {
        res.status(400).json({
            success: false, error: 'No code provided.'
        });
        return;
    }

    const discordUserId = req.body.id;

    if (!discordUserId) {
        res.status(400).json({
            success: false, error: 'No Discord user ID provided.'
        });
        return;
    }

    const notExists = await redis.exists(verificationCode).then(exists => !exists);

    if (notExists) {
        res.status(400).json({
            success: false, error: 'Invalid verification code!'
        });
        return;
    }

    const minecraftId = await redis.get(verificationCode);

    await redis.del(verificationCode);
    await redis.del(minecraftId);

    await redis.set('discord:' + discordUserId, minecraftId, {EX: 60 * 10});
    await redis.set('minecraft:' + minecraftId, discordUserId, {EX: 60 * 10});

    await mariadb.query('INSERT INTO discord_link_data (minecraftId, discordId) VALUES (?, ?) ON DUPLICATE KEY UPDATE discordId = ?;', [minecraftId, discordUserId, discordUserId]);

    console.log('Successfully completed verification process for ' + minecraftId + '.');

    res.status(200).json({
        success: true, id: minecraftId
    });
});

module.exports = router;
