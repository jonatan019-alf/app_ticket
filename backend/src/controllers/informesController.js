const InformeModel = require('../models/informeModel');
const { enviarInformeTecnicoAlArea } = require('../services/emailService');

// Crear un informe
const crearInforme = async (req, res) => {
  try {
    const { area_id, tecnico_id, titulo, fecha_visita, trabajo_realizado, recomendaciones, ticket_id } = req.body;

    if (!area_id || !tecnico_id || !titulo || !trabajo_realizado) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const nuevoInforme = await InformeModel.create({
      tecnico_id,
      area_id,
      titulo,
      fecha_visita,
      trabajo_realizado,
      recomendaciones,
      ticket_id
    });

    if (typeof enviarInformeTecnicoAlArea === 'function') {
      enviarInformeTecnicoAlArea(nuevoInforme).catch((err) => {
        console.error('❌ Error asíncrono al enviar informe técnico al área:', err.message);
      });
    }

    return res.status(201).json(nuevoInforme);
  } catch (error) {
    console.error('Error al crear informe:', error);
    return res.status(500).json({ error: 'Error interno al guardar el informe técnico' });
  }
};

// Obtener todos los informes
const obtenerInformes = async (req, res) => {
  try {
    const informes = await InformeModel.getAll();
    return res.json(informes);
  } catch (error) {
    console.error('Error al listar informes:', error);
    return res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
};

// Obtener informe por ID
const obtenerInformePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const informe = await InformeModel.getById(id);

    if (!informe) {
      return res.status(404).json({ error: 'Informe técnico no encontrado' });
    }

    return res.json(informe);
  } catch (error) {
    console.error('Error al obtener informe:', error);
    return res.status(500).json({ error: 'Error al consultar el informe técnico' });
  }
};

module.exports = {
  crearInforme,
  obtenerInformes,
  obtenerInformePorId
};