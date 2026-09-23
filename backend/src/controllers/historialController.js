const Historial = require('../models/historialModel');
const Ticket = require('../models/ticketModel');

// Obtener TODO el historial global
const getAllHistorial = async (req, res) => {
  try {
    const historial = await Historial.getAll();
    res.status(200).json(historial);
  } catch (error) {
    console.error('❌ ERROR AL OBTENER HISTORIAL GLOBAL:', error);
    res.status(500).json({ error: 'Error al obtener el historial global: ' + error.message });
  }
};

// Obtener el historial de un ticket por su ticket_id
const getHistorialByTicket = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const ticketExistente = await Ticket.getById(ticketId);
    if (!ticketExistente) {
      return res.status(404).json({ error: 'El ticket no existe' });
    }

    const historial = await Historial.getByTicketId(ticketId);
    res.status(200).json(historial);
  } catch (error) {
    console.error('❌ ERROR AL OBTENER HISTORIAL:', error);
    res.status(500).json({ error: 'Error al obtener el historial: ' + error.message });
  }
};

// Crear una nota/evento manual en el historial de un ticket
const createHistorialEntry = async (req, res) => {
  const { ticketId } = req.params;
  const { tecnico_id, estado_anterior, estado_nuevo, nota_tecnica } = req.body;

  try {
    const ticketExistente = await Ticket.getById(ticketId);
    if (!ticketExistente) {
      return res.status(404).json({ error: 'El ticket no existe' });
    }

    const nuevaEntrada = await Historial.create({
      ticket_id: ticketId,
      tecnico_id,
      estado_anterior,
      estado_nuevo,
      nota_tecnica
    });

    res.status(201).json(nuevaEntrada);
  } catch (error) {
    console.error('❌ ERROR AL CREAR HISTORIAL:', error);

    if (error.code === '23503') {
      return res.status(400).json({ error: 'El técnico asignado o el ticket especificado no existen.' });
    }

    res.status(500).json({ error: 'Error al agregar registro al historial: ' + error.message });
  }
};

module.exports = {
  getAllHistorial,
  getHistorialByTicket,
  createHistorialEntry
};