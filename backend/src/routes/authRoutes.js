const express = require('express');
const router = express.Router();
const { loginTecnico } = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', loginTecnico);

module.exports = router;