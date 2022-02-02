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

    const accountType = req.header('Account-Type');

    if (!accountType) {
        res.status(400).json({
            success: false, error: 'No Account-Type header set.'
        });
        return;
    }

    const sanitizedAccountType = accountType.toLowerCase()

    if (sanitizedAccountType !== 'minecraft' && sanitizedAccountType !== 'discord') {
        res.status(400).json({
            success: false, error: 'Invalid Account-Type header.'
        });
        return
    }

    const providedId = req.body.id;

    if (!providedId) {
        res.status(400).json({
            success: false, error: 'No ID provided.'
        });
        return;
    }

    const notExists = await redis.exists(sanitizedAccountType + ':' + providedId).then(exists => !exists);

    if (notExists) {
        let id;
        if (sanitizedAccountType === 'minecraft') {
            const response = await mariadb.query('SELECT discordId FROM discord_link_data WHERE minecraftId = ?', [providedId]);
            if (!response[0]) {
                res.status(400).json({
                    success: false, error: 'No Discord account exists for that id!'
                });
                return;
            }
            id = response[0].discordId;
        }
        if (sanitizedAccountType === 'discord') {
            const response = await mariadb.query('SELECT minecraftId FROM discord_link_data WHERE discordId = ?', [providedId]);
            if (!response[0]) {
                res.status(400).json({
                    success: false, error: 'No Minecraft account exists for that id!'
                });
                return;
            }
            id = response[0].minecraftId;
        }
        await redis.set(sanitizedAccountType + ':' + providedId, id, {EX: 60 * 10});
    }

    const id = await redis.get(sanitizedAccountType + ':' + providedId);

    console.log('Successfully identified account ' + providedId + ' as ' + id);

    res.status(200).json({
        success: true, id: id
    });
});

module.exports = router;
