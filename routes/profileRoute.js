const express = require('express');
const router = express.Router();
const ProfileContoller = require('../controllers/ProfileController');

router.get('/', ProfileContoller.profileControl);
router.get('/:name', ProfileContoller.profile);

module.exports = router;