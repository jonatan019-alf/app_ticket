const Ticket = require('../models/ticketModel');
const Historial = require('../models/historialModel');
const { enviarConfirmacionTicket, enviarActualizacionTicket } = require('../services/emailService');

// Obtener todos los tickets (incluyendo su última nota técnica si la tienen)
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.getAll();

    // Mapeamos para garantizar que cada ticket traiga la propiedad nota_tecnica
    const ticketsConNota = await Promise.all(
      tickets.map(async (ticket) => {
        if (!ticket.nota_tecnica) {
          const historial = await Historial.getByTicketId(ticket.id);
          // Si hay historial, tomamos la nota más reciente que no sea nula
          const ultimaNota = historial ? historial.reverse().find(h => h.nota_tecnica && h.nota_tecnica.trim() !== '') : null;
          ticket.nota_tecnica = ultimaNota ? ultimaNota.nota_tecnica : '';
        }
        return ticket;
      })
    );

    res.status(200).json(ticketsConNota);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los tickets: ' + error.message });
  }
};

// Obtener ticket por ID (adjunta la última solución registrada en el historial)
const getTicketById = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await Ticket.getById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Buscamos las notas históricas asociadas a este ticket para adjuntar la solución previa
    const historial = await Historial.getByTicketId(id);
    const ultimaNota = historial ? historial.reverse().find(h => h.nota_tecnica && h.nota_tecnica.trim() !== '') : null;

    ticket.nota_tecnica = ticket.nota_tecnica || (ultimaNota ? ultimaNota.nota_tecnica : '');

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el ticket: ' + error.message });
  }
};

// Crear ticket
const createTicket = async (req, res) => {
  const { 
    codigo_ticket, 
    area_id, 
    categoria_id, 
    asignado_a_tecnico_id,
    usuario_reporta, 
    email_contacto,
    titulo, 
    descripcion_problema,
    prioridad 
  } = req.body;

  if (!codigo_ticket || !area_id || !categoria_id || !usuario_reporta || !titulo || !descripcion_problema) {
    return res.status(400).json({ 
      error: 'Los campos codigo_ticket, area_id, categoria_id, usuario_reporta, titulo y descripcion_problema son obligatorios.' 
    });
  }

  try {
    const datosNuevoTicket = {
      codigo_ticket,
      area_id: parseInt(area_id, 10),
      categoria_id: parseInt(categoria_id, 10),
      asignado_a_tecnico_id: asignado_a_tecnico_id ? parseInt(asignado_a_tecnico_id, 10) : null,
      usuario_reporta,
      email_contacto: email_contacto || 'sin_correo@ejemplo.com',
      titulo,
      descripcion_problema,
      prioridad: prioridad ? prioridad.toUpperCase() : 'MEDIA'
    };

    // 1. Guardar e incluir los nombres formateados
    const nuevoTicket = await Ticket.create(datosNuevoTicket);

    // 2. Fusionar datos para garantizar que email_contacto y codigo_ticket no queden en undefined
    const payloadEmail = {
      ...datosNuevoTicket,
      ...(nuevoTicket || {})
    };

    // 3. Disparar e-mail de confirmación atrapando posibles errores asíncronos
    if (typeof enviarConfirmacionTicket === 'function') {
      enviarConfirmacionTicket(payloadEmail).catch((err) => {
        console.error('❌ Error asíncrono al enviar correo de confirmación:', err.message);
      });
    }

    // 4. Responder al cliente
    res.status(201).json(nuevoTicket || datosNuevoTicket);

  } catch (error) {
    console.error('❌ ERROR AL CREAR TICKET:', error);

    if (error.code === '23505') {
      return res.status(400).json({ error: 'El código de ticket ya existe. Debe ser único.' });
    }

    if (error.code === '23503') {
      return res.status(400).json({ error: 'El área, categoría o técnico especificado no existe.' });
    }

    if (error.code === '23514') {
      return res.status(400).json({ error: 'Valor no permitido en el campo prioridad o estado_actual.' });
    }

    res.status(500).json({
      error: 'Error al crear el ticket',
      mensaje: error.message,
      detalle: error.detail || null
    });
  }
};

// Actualizar ticket y registrar la solución en el historial
const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { nota_tecnica, asignado_a_tecnico_id, estado_actual, prioridad } = req.body;

  try {
    const ticketExistente = await Ticket.getById(id);
    if (!ticketExistente) {
      return res.status(404).json({ error: 'El ticket no existe' });
    }

    const estadoAnterior = ticketExistente.estado_actual;
    const nuevoEstado = estado_actual ? estado_actual.toUpperCase() : ticketExistente.estado_actual;

    const dataActualizada = {
      area_id: req.body.area_id !== undefined ? parseInt(req.body.area_id, 10) : ticketExistente.area_id,
      categoria_id: req.body.categoria_id !== undefined ? parseInt(req.body.categoria_id, 10) : ticketExistente.categoria_id,
      asignado_a_tecnico_id: asignado_a_tecnico_id !== undefined 
        ? (asignado_a_tecnico_id ? parseInt(asignado_a_tecnico_id, 10) : null)
        : ticketExistente.asignado_a_tecnico_id,
      usuario_reporta: req.body.usuario_reporta || ticketExistente.usuario_reporta,
      email_contacto: req.body.email_contacto || ticketExistente.email_contacto,
      titulo: req.body.titulo || ticketExistente.titulo,
      descripcion_problema: req.body.descripcion_problema || ticketExistente.descripcion_problema,
      prioridad: prioridad ? prioridad.toUpperCase() : ticketExistente.prioridad,
      estado_actual: nuevoEstado,
      nota_tecnica: nota_tecnica !== undefined ? nota_tecnica : ticketExistente.nota_tecnica
    };

    // 1. Actualizar el registro del ticket
    const ticketActualizado = await Ticket.update(id, dataActualizada, nota_tecnica);

    // 2. Registrar la entrada en historial_tickets para persistir la solución/observación
    if (nota_tecnica || estadoAnterior !== nuevoEstado) {
      await Historial.create({
        ticket_id: id,
        tecnico_id: dataActualizada.asignado_a_tecnico_id,
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevoEstado,
        nota_tecnica: nota_tecnica || null
      });
    }

    // 3. Formatear la respuesta con la nota técnica cargada
    const respuestaFinal = {
      ...ticketExistente,
      ...(ticketActualizado || {}),
      ...dataActualizada,
      id: parseInt(id, 10),
      codigo_ticket: ticketExistente.codigo_ticket || dataActualizada.codigo_ticket,
      nota_tecnica: nota_tecnica || dataActualizada.nota_tecnica || ''
    };

    // 4. DISPARAR EMAIL DE ACTUALIZACIÓN AL CLIENTE
    if (typeof enviarActualizacionTicket === 'function') {
      enviarActualizacionTicket(respuestaFinal).catch((err) => {
        console.error('❌ Error asíncrono al enviar correo de actualización:', err.message);
      });
    }

    res.status(200).json({
      mensaje: 'Ticket actualizado correctamente',
      ticket: respuestaFinal
    });

  } catch (error) {
    console.error('❌ ERROR AL ACTUALIZAR TICKET:', error);

    if (error.code === '23514') {
      return res.status(400).json({ error: 'Valor no permitido en el campo prioridad o estado_actual.' });
    }

    res.status(500).json({ error: 'Error al actualizar el ticket: ' + error.message });
  }
};

// Eliminar ticket
const deleteTicket = async (req, res) => {
  const { id } = req.params;

  try {
    const ticketEliminado = await Ticket.delete(id);
    if (!ticketEliminado) {
      return res.status(404).json({ error: 'El ticket no existe' });
    }

    res.status(200).json({
      mensaje: 'Ticket eliminado correctamente',
      ticket: ticketEliminado
    });
  } catch (error) {
    console.error('❌ ERROR AL ELIMINAR TICKET:', error);
    res.status(500).json({ error: 'Error al eliminar el ticket: ' + error.message });
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
};
