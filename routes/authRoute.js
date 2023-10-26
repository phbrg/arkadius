const express = require('express');
const router = express.Router();
const AuthContoller = require('../controllers/AuthController');
const authMiddleware = require('../middlewares/auth').checkAuth;

const upload = require('../middlewares/multer');

const { rateLimit } = require('express-rate-limit');

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	message: (req, res) => {
		req.flash('message', 'Too many requests from this IP adress, try agaiin after 15 min');
    res.redirect('/auth/login');
  },
	standardHeaders: 'draft-7',
	legacyHeaders: false,
});


router.get('/login', AuthContoller.loginPage);
router.get('/register', AuthContoller.registerPage);
router.get('/edit_profile', authMiddleware, AuthContoller.editProfile);
router.get('/edit_user', authMiddleware, AuthContoller.editUser);
router.get('/forget_password', AuthContoller.forgetPassword);

router.post('/register', AuthContoller.createUser);
router.post('/login', limiter, AuthContoller.login);
router.post('/edit_profile', authMiddleware, limiter, upload.single('icon'), AuthContoller.editProfilePost);
router.post('/edit_user', authMiddleware, limiter, AuthContoller.editUserPost);
router.post('/forget_password', AuthContoller.forgetPasswordPost);

router.post('/delete_user', authMiddleware, limiter, AuthContoller.deleteUser);

router.get('/logout', AuthContoller.logout);

module.exports = router;