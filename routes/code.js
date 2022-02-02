const express = require('express');
const router = express.Router();

const crypto = require('crypto');

const security = require('../utils/security_utils')
const redis = require('../utils/redis_utils');

router.post('/', async (req, res) => {
    const apiKey = req.header('API-Key');

    if (!await security.verifyApiKey(apiKey)) {
        res.status(400).json({
            success: false, error: 'Invalid API key.'
        });
        return;
    }

    const id = req.body.id;

    if (!id) {
        res.status(400).json({
            success: false, error: 'No ID provided.'
        });
        return;
    }

    const notExists = await redis.exists('verification:' + id).then(exists => !exists);

    if (notExists) {
        const verificationCode = crypto.randomInt(1000000).toString().padStart(6, "0");
        await redis.set('verification:' + id, verificationCode, {EX: 60 * 5});
        await redis.set(verificationCode, id, {EX: 60 * 5});
    }

    let verificationCode = await redis.get('verification:' + id);

    console.log('Successfully started verification process for ' + id + ' code: ' + verificationCode);

    res.status(200).json({
        success: true, code: verificationCode
    });
});

module.exports = router;
