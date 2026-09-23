const express = require('express');
const router = express.Router();
const { getCategorias, createCategoria, updateCategoria, deleteCategoria } = require('../controllers/categoriaController');

// Endpoints para /api/categorias
router.get('/', getCategorias);
router.post('/', createCategoria);
router.put('/:id', updateCategoria);
router.delete('/:id', deleteCategoria);

module.exports = router;