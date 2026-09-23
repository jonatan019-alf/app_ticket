const express = require('express');
const router = express.Router();
const { 
  crearInforme, 
  obtenerInformes, 
  obtenerInformePorId 
} = require('../controllers/informesController');

// Rutas /api/informes-tecnicos
router.post('/', crearInforme);
router.get('/', obtenerInformes);
router.get('/:id', obtenerInformePorId);

module.exports = router;