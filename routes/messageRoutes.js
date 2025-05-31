const express = require('express');
const router = express.Router();
const {sendMessage,getMessagesByConversation}= require('../controllers/messageController');
const { verifyAnyUser} = require('../middleware/authMiddleware');
// Gửi tin nhắn
router.post('/',verifyAnyUser, sendMessage);

// Lấy tin nhắn theo conversationId
router.get('/:conversationId',verifyAnyUser, getMessagesByConversation);

module.exports = router;
