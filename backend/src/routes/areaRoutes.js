const express = require('express');
const router = express.Router();
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/areaController');

// Endpoints para /api/areas
router.get('/', getAreas);
router.post('/', createArea);
router.put('/:id', updateArea);
router.delete('/:id', deleteArea);
module.exports = router;