const express = require('express');
const router = express.Router();
const { getMoments, createMoment, deleteMoment, likeMoment, unlikeMoment } = require('../controllers/momentController');
const { getComments, createComment, deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getMoments);
router.post('/', createMoment);
router.delete('/:momentId', deleteMoment);

// 点赞
router.post('/:momentId/like', likeMoment);
router.delete('/:momentId/like', unlikeMoment);

// 评论
router.get('/:momentId/comments', getComments);
router.post('/:momentId/comments', createComment);
router.delete('/:momentId/comments/:commentId', deleteComment);

module.exports = router;




