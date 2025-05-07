const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Routes d'authentification
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/verify', authController.verify.bind(authController));
router.post('/logout', authController.logout.bind(authController));

module.exports = router;