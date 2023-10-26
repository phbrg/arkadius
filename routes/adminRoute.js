const express = require('express');
const router = express.Router();
const AdminContoller = require('../controllers/AdminController');
const adminMiddleware = require('../middlewares/admin').checkAdmin;
const authMiddleware = require('../middlewares/auth').checkAuth;

router.get('/', authMiddleware, adminMiddleware, AdminContoller.dashboard);
router.get('/:id', authMiddleware, adminMiddleware, AdminContoller.editUser);

router.post('/:id', authMiddleware, adminMiddleware, AdminContoller.editUserPost);
router.post('/ban/:id', authMiddleware, adminMiddleware, AdminContoller.banUser);

module.exports = router;