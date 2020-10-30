const express = require('express');

const job = require('../controllers/job');

const router = express.Router();

router.get("/:id/logs", job.getLogs);

router.get("/:id/retry", job.retryJob);

router.get("/:id/remove", job.removeJob);

router.get("/restart", job.restartQueue);

module.exports = router;