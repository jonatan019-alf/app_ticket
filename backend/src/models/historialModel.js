const pool = require('../config/db');

const Historial = {
  // Obtener TODO el historial global con detalles completos del ticket, área, categoría y técnico
  getAll: async () => {
    const query = `
      SELECT 
        h.id AS historial_id,
        h.ticket_id,
        h.tecnico_id,
        h.estado_anterior,
        h.estado_nuevo,
        h.nota_tecnica,
        h.creado_en AS fecha_movimiento,
        
        -- Datos detallados del ticket
        t.codigo_ticket,
        t.titulo AS ticket_titulo,
        t.descripcion_problema,
        t.usuario_reporta,
        t.email_contacto,
        t.prioridad,
        t.estado_actual,
        
        -- Relaciones adicionales
        a.nombre AS area_nombre,
        c.nombre AS categoria_nombre,
        tec.nombre AS tecnico_nombre
      FROM historial_tickets h
      LEFT JOIN tickets t ON h.ticket_id = t.id
      LEFT JOIN areas a ON t.area_id = a.id
      LEFT JOIN categorias c ON t.categoria_id = c.id
      LEFT JOIN tecnicos tec ON h.tecnico_id = tec.id
      ORDER BY h.creado_en DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // Obtener todo el historial de un ticket específico con sus datos contextuaes
  getByTicketId: async (ticket_id) => {
    const query = `
      SELECT 
        h.id AS historial_id,
        h.ticket_id,
        h.tecnico_id,
        h.estado_anterior,
        h.estado_nuevo,
        h.nota_tecnica,
        h.creado_en AS fecha_movimiento,
        
        -- Datos del ticket
        t.codigo_ticket,
        t.titulo AS ticket_titulo,
        t.descripcion_problema,
        t.usuario_reporta,
        t.email_contacto,
        
        -- Nombre del técnico que realizó la nota/cambio
        tec.nombre AS tecnico_nombre
      FROM historial_tickets h
      LEFT JOIN tickets t ON h.ticket_id = t.id
      LEFT JOIN tecnicos tec ON h.tecnico_id = tec.id
      WHERE h.ticket_id = $1
      ORDER BY h.creado_en ASC;
    `;
    const { rows } = await pool.query(query, [ticket_id]);
    return rows;
  },

  // Crear una entrada en el historial (soporta ejecuciones con pool o transacciones mediante `client`)
  create: async (data, client = pool) => {
    const {
      ticket_id,
      tecnico_id = null,
      estado_anterior = null,
      estado_nuevo = null,
      nota_tecnica = null
    } = data;

    const query = `
      INSERT INTO historial_tickets (
        ticket_id, 
        tecnico_id, 
        estado_anterior, 
        estado_nuevo, 
        nota_tecnica
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [ticket_id, tecnico_id, estado_anterior, estado_nuevo, nota_tecnica];
    const { rows } = await client.query(query, values);
    return rows[0];
  }
};

module.exports = Historial;

