const express = require('express');
const router = express.Router();
const { getPets, getPetById, addPet, updatePet, deletePet } = require('../controllers/petController');

const { getRoutines, addRoutine, updateRoutine, deleteRoutine, getRoutineRecords, toggleRoutineRecord } = require('../controllers/routineController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getPets);
router.get('/:petId', getPetById);
router.post('/', addPet);
router.put('/:petId', updatePet);
router.delete('/:petId', deletePet);



// 打卡活动与记录
router.get('/:petId/routines', getRoutines);
router.post('/:petId/routines', addRoutine);
router.put('/:petId/routines/:routineId', updateRoutine);
router.delete('/:petId/routines/:routineId', deleteRoutine);
router.get('/:petId/routine-records', getRoutineRecords);
router.post('/:petId/routines/:routineId/toggle', toggleRoutineRecord);

module.exports = router;
























