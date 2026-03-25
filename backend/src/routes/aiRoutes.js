const express = require('express');
const router = express.Router();
const { chatWithAI, getConversation } = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/chat', chatWithAI);
router.get('/conversations/:conversationId', getConversation);

module.exports = router;



