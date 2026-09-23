const Categoria = require('../models/categoriaModel');

const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.getAll();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las categorías: ' + error.message });
  }
};

const createCategoria = async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }

  try {
    const nuevaCategoria = await Categoria.create(nombre);
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error('❌ ERROR DETALLADO EN EL CONTROLADOR DE CATEGORÍAS:', error);

    res.status(500).json({
      error: 'Error al crear la categoría',
      mensaje: error.message || error.toString(),
      detalle: error.detail || null,
      codigo: error.code || null
    });
  }
};

// Actualizar categoría
const updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }

  try {
    const categoriaActualizada = await Categoria.update(id, nombre);

    if (!categoriaActualizada) {
      return res.status(404).json({ error: 'La categoría no existe' });
    }

    res.status(200).json({
      mensaje: 'Categoría actualizada correctamente',
      categoria: categoriaActualizada
    });
  } catch (error) {
    console.error('❌ ERROR AL ACTUALIZAR CATEGORÍA:', error);
    res.status(500).json({ error: 'Error al actualizar la categoría: ' + error.message });
  }
};

// Eliminar categoría
const deleteCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    const categoriaEliminada = await Categoria.delete(id);

    if (!categoriaEliminada) {
      return res.status(404).json({ error: 'La categoría no existe' });
    }

    res.status(200).json({
      mensaje: 'Categoría eliminada correctamente',
      categoria: categoriaEliminada
    });
  } catch (error) {
    console.error('❌ ERROR AL ELIMINAR CATEGORÍA:', error);

    // Código 23503: Violación de Foreign Key (si hay tickets usando la categoría)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'No se puede eliminar la categoría porque está asociada a uno o más tickets.'
      });
    }

    res.status(500).json({ error: 'Error al eliminar la categoría: ' + error.message });
  }
};

module.exports = {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria
};