const express = require('express');
const router = express.Router();
const { getMoments, getMomentById, createMoment, deleteMoment, likeMoment, unlikeMoment } = require('../controllers/momentController');
const { getComments, createComment, deleteComment, getMyComments } = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

// 公开接口：获取单条动态（分享链接用，不需要登录）
router.get('/public/:momentId', getMomentById);

router.use(authMiddleware);

router.get('/', getMoments);
router.post('/', createMoment);
router.delete('/:momentId', deleteMoment);

// 点赞
router.post('/:momentId/like', likeMoment);
router.delete('/:momentId/like', unlikeMoment);

// 评论
router.get('/my-comments', getMyComments);
router.get('/:momentId/comments', getComments);
router.post('/:momentId/comments', createComment);
router.delete('/:momentId/comments/:commentId', deleteComment);

module.exports = router;











