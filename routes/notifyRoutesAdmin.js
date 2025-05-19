const express = require('express');
const router = express.Router();
const notifyController = require('../controllers/notifyControllerAdmin');

// GET /api/notifies/:userId
router.get('/:userId', notifyController.getNotifiesByUser);

module.exports = router;
