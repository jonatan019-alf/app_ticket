const express = require('express');
const router = express.Router();
const { getTecnicos, createTecnico, deleteTecnico, updateTecnico } = require('../controllers/tecnicoController');

// Endpoints para /api/tecnicos
router.get('/', getTecnicos);
router.post('/', createTecnico);
router.delete('/:id', deleteTecnico); // <-- Nueva ruta para borrar por ID
router.put('/:id', updateTecnico); // <-- Nueva ruta para modificar por ID

module.exports = router;