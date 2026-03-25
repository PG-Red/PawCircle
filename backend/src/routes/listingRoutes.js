const express = require('express');
const router = express.Router();
const { getListings, getListingById, createListing, updateListing, deleteListing, markSold } = require('../controllers/listingController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getListings);
router.get('/:listingId', getListingById);
router.post('/', createListing);
router.put('/:listingId', updateListing);
router.delete('/:listingId', deleteListing);
router.patch('/:listingId/mark-sold', markSold);

module.exports = router;




