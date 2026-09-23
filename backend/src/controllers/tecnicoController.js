const Tecnico = require('../models/tecnicoModel');

const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await Tecnico.getAll();
    res.status(200).json(tecnicos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los técnicos: ' + error.message });
  }
};

const createTecnico = async (req, res) => {
  const { nombre, email, password, activo, es_admin } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ 
      error: 'Los campos nombre, email y contraseña son obligatorios.' 
    });
  }

  try {
    const nuevoTecnico = await Tecnico.create({ nombre, email, password, activo, es_admin });
    res.status(201).json(nuevoTecnico);
  } catch (error) {
    console.error('❌ ERROR EN EL CONTROLADOR DE TÉCNICOS:', error);

    // Email duplicado
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ingresado ya existe.' });
    }

    res.status(500).json({
      error: 'Error al crear el técnico',
      mensaje: error.message || error.toString()
    });
  }
};

const deleteTecnico = async (req, res) => {
  const { id } = req.params;
  try {
    const tecnicoEliminado = await Tecnico.delete(id);
    if (!tecnicoEliminado) {
      return res.status(404).json({ error: 'El técnico no existe' });
    }
    res.status(200).json({ mensaje: 'Técnico eliminado correctamente', tecnico: tecnicoEliminado });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'No se puede eliminar el técnico porque ya está asignado a tickets.' });
    }
    res.status(500).json({ error: 'Error al eliminar el técnico: ' + error.message });
  }
};

const updateTecnico = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password, activo, es_admin } = req.body;

  try {
    const tecnicoActualizado = await Tecnico.update(id, { nombre, email, password, activo, es_admin });
    if (!tecnicoActualizado) {
      return res.status(404).json({ error: 'El técnico no existe' });
    }
    res.status(200).json({ mensaje: 'Técnico actualizado correctamente', tecnico: tecnicoActualizado });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el técnico: ' + error.message });
  }
};

module.exports = {
  getTecnicos,
  createTecnico,
  deleteTecnico,
  updateTecnico
};
