const express = require('express');
const router = express.Router();
const { getPets, getPetById, addPet, updatePet, deletePet } = require('../controllers/petController');
const { getFeedingRecords, addFeedingRecord } = require('../controllers/feedingController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getPets);
router.get('/:petId', getPetById);
router.post('/', addPet);
router.put('/:petId', updatePet);
router.delete('/:petId', deletePet);

// 喂养记录（嵌套在宠物路由下）
router.get('/:petId/feeding-records', getFeedingRecords);
router.post('/:petId/feeding-records', addFeedingRecord);

module.exports = router;



