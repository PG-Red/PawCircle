const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getUnreadSummary,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getConversations,
  getMessagesWithFriend,
  markMessagesAsRead,
  sendMessageToFriend,
} = require('../controllers/friendController');

router.use(authMiddleware);

router.get('/unread-summary', getUnreadSummary);
router.get('/requests/pending', getPendingRequests);
router.post('/requests', sendFriendRequest);
router.post('/requests/:requestId/accept', acceptFriendRequest);
router.post('/requests/:requestId/reject', rejectFriendRequest);

router.get('/friends', getFriends);
router.get('/conversations', getConversations);
router.get('/messages/:friendId', getMessagesWithFriend);
router.post('/messages/:friendId/read', markMessagesAsRead);
router.post('/messages/:friendId', sendMessageToFriend);

module.exports = router;

