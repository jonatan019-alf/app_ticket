const pool = require('../config/db');

const Ticket = {
  // Obtener todos los tickets con nombres de Área, Categoría y Técnico
  getAll: async () => {
    const query = `
      SELECT 
        t.*,
        a.nombre AS area_nombre,
        c.nombre AS categoria_nombre,
        tec.nombre AS tecnico_nombre
      FROM tickets t
      LEFT JOIN areas a ON t.area_id = a.id
      LEFT JOIN categorias c ON t.categoria_id = c.id
      LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
      ORDER BY t.creado_en DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // Obtener un ticket por ID (Incluye los JOINs completos)
  getById: async (id) => {
    const query = `
      SELECT 
        t.*,
        a.nombre AS area_nombre,
        c.nombre AS categoria_nombre,
        tec.nombre AS tecnico_nombre
      FROM tickets t
      LEFT JOIN areas a ON t.area_id = a.id
      LEFT JOIN categorias c ON t.categoria_id = c.id
      LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
      WHERE t.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  // Crear un nuevo ticket y guardar automáticamente su primer registro en el historial
  create: async (data) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN'); // Iniciar transacción

      const {
        codigo_ticket,
        area_id,
        categoria_id,
        asignado_a_tecnico_id = null,
        usuario_reporta,
        email_contacto = 'sin_correo@ejemplo.com',
        titulo,
        descripcion_problema,
        prioridad = 'MEDIA',
        estado_actual = 'ABIERTO'
      } = data;

      // 1. Insertar en la tabla "tickets"
      const queryTicket = `
        INSERT INTO tickets (
          codigo_ticket, 
          area_id, 
          categoria_id, 
          asignado_a_tecnico_id,
          usuario_reporta, 
          email_contacto, 
          titulo, 
          descripcion_problema, 
          prioridad, 
          estado_actual
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id;
      `;
      const valuesTicket = [
        codigo_ticket,
        area_id,
        categoria_id,
        asignado_a_tecnico_id,
        usuario_reporta,
        email_contacto,
        titulo,
        descripcion_problema,
        prioridad,
        estado_actual
      ];

      const resTicket = await client.query(queryTicket, valuesTicket);
      const nuevoTicketId = resTicket.rows[0].id;

      // 2. Registrar la creación en la tabla "historial_tickets" sin duplicar el problema
      const queryHistorial = `
        INSERT INTO historial_tickets (
          ticket_id, 
          tecnico_id, 
          estado_anterior, 
          estado_nuevo, 
          nota_tecnica
        )
        VALUES ($1, $2, $3, $4, $5);
      `;
      const valuesHistorial = [
        nuevoTicketId,
        asignado_a_tecnico_id,
        'NUEVO',
        estado_actual,
        null // 👈 CORREGIDO: Se pasa null para que la solución no se llene con la descripción del problema
      ];

      await client.query(queryHistorial, valuesHistorial);

      await client.query('COMMIT');

      // 3. Consultar y retornar el ticket completo con sus JOINs
      const ticketCompleto = await Ticket.getById(nuevoTicketId);
      return ticketCompleto;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Actualizar ticket y registrar historial si cambia de estado
  update: async (id, data, nota_tecnica = null) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Obtener estado actual antes de modificar
      const resOld = await client.query('SELECT estado_actual, asignado_a_tecnico_id FROM tickets WHERE id = $1', [id]);
      if (resOld.rows.length === 0) {
        throw new Error('Ticket no encontrado');
      }
      const estadoAnterior = resOld.rows[0].estado_actual;

      const {
        area_id,
        categoria_id,
        asignado_a_tecnico_id,
        usuario_reporta,
        email_contacto,
        titulo,
        descripcion_problema,
        prioridad,
        estado_actual
      } = data;

      // 2. Actualizar la tabla tickets
      const queryUpdate = `
        UPDATE tickets
        SET 
          area_id = $1,
          categoria_id = $2,
          asignado_a_tecnico_id = $3,
          usuario_reporta = $4,
          email_contacto = $5,
          titulo = $6,
          descripcion_problema = $7,
          prioridad = $8,
          estado_actual = $9,
          actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $10;
      `;

      const valuesUpdate = [
        area_id, 
        categoria_id, 
        asignado_a_tecnico_id, 
        usuario_reporta,
        email_contacto,
        titulo, 
        descripcion_problema, 
        prioridad, 
        estado_actual, 
        id
      ];

      await client.query(queryUpdate, valuesUpdate);

      // 3. Si hubo un cambio de estado, registramos en historial_tickets
      if (estadoAnterior !== estado_actual) {
        const queryHistorial = `
          INSERT INTO historial_tickets (
            ticket_id, 
            tecnico_id, 
            estado_anterior, 
            estado_nuevo, 
            nota_tecnica
          )
          VALUES ($1, $2, $3, $4, $5);
        `;
        const valuesHistorial = [
          id,
          asignado_a_tecnico_id || resOld.rows[0].asignado_a_tecnico_id,
          estadoAnterior,
          estado_actual,
          nota_tecnica || `Estado actualizado a ${estado_actual}`
        ];

        await client.query(queryHistorial, valuesHistorial);
      }

      await client.query('COMMIT');

      // 4. Retornar el ticket actualizado
      const ticketActualizado = await Ticket.getById(id);
      return ticketActualizado;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Eliminar ticket
  delete: async (id) => {
    const query = 'DELETE FROM tickets WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
};

module.exports = Ticket;

// const pool = require('../config/db');

// const Ticket = {
//   // Obtener todos los tickets con nombres de Área, Categoría y Técnico
//   getAll: async () => {
//     const query = `
//       SELECT 
//         t.*,
//         a.nombre AS area_nombre,
//         c.nombre AS categoria_nombre,
//         tec.nombre AS tecnico_nombre
//       FROM tickets t
//       LEFT JOIN areas a ON t.area_id = a.id
//       LEFT JOIN categorias c ON t.categoria_id = c.id
//       LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
//       ORDER BY t.creado_en DESC;
//     `;
//     const { rows } = await pool.query(query);
//     return rows;
//   },

//   // Obtener un ticket por ID (Incluye los JOINs completos)
//   getById: async (id) => {
//     const query = `
//       SELECT 
//         t.*,
//         a.nombre AS area_nombre,
//         c.nombre AS categoria_nombre,
//         tec.nombre AS tecnico_nombre
//       FROM tickets t
//       LEFT JOIN areas a ON t.area_id = a.id
//       LEFT JOIN categorias c ON t.categoria_id = c.id
//       LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
//       WHERE t.id = $1;
//     `;
//     const { rows } = await pool.query(query, [id]);
//     return rows[0];
//   },

//   // Crear un nuevo ticket y guardar automáticamente su primer registro en el historial
//   create: async (data) => {
//     const client = await pool.connect();

//     try {
//       await client.query('BEGIN'); // Iniciar transacción

//       const {
//         codigo_ticket,
//         area_id,
//         categoria_id,
//         asignado_a_tecnico_id = null,
//         usuario_reporta,
//         email_contacto = 'sin_correo@ejemplo.com',
//         titulo,
//         descripcion_problema,
//         prioridad = 'MEDIA',
//         estado_actual = 'ABIERTO'
//       } = data;

//       // 1. Insertar en la tabla "tickets"
//       const queryTicket = `
//         INSERT INTO tickets (
//           codigo_ticket, 
//           area_id, 
//           categoria_id, 
//           asignado_a_tecnico_id,
//           usuario_reporta, 
//           email_contacto, 
//           titulo, 
//           descripcion_problema, 
//           prioridad, 
//           estado_actual
//         )
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//         RETURNING id;
//       `;
//       const valuesTicket = [
//         codigo_ticket,
//         area_id,
//         categoria_id,
//         asignado_a_tecnico_id,
//         usuario_reporta,
//         email_contacto,
//         titulo,
//         descripcion_problema,
//         prioridad,
//         estado_actual
//       ];

//       const resTicket = await client.query(queryTicket, valuesTicket);
//       const nuevoTicketId = resTicket.rows[0].id;

//       // 2. Registrar la creación en la tabla "historial_tickets"
//       const queryHistorial = `
//         INSERT INTO historial_tickets (
//           ticket_id, 
//           tecnico_id, 
//           estado_anterior, 
//           estado_nuevo, 
//           nota_tecnica
//         )
//         VALUES ($1, $2, $3, $4, $5);
//       `;
//       const valuesHistorial = [
//         nuevoTicketId,
//         asignado_a_tecnico_id,
//         'NUEVO',
//         estado_actual,
//         descripcion_problema
//       ];

//       await client.query(queryHistorial, valuesHistorial);

//       await client.query('COMMIT');

//       // 3. Consultar y retornar el ticket completo con sus JOINs (área, categoría, técnico)
//       const ticketCompleto = await Ticket.getById(nuevoTicketId);
//       return ticketCompleto;

//     } catch (error) {
//       await client.query('ROLLBACK');
//       throw error;
//     } finally {
//       client.release();
//     }
//   },

//   // Actualizar ticket y registrar historial si cambia de estado
//   update: async (id, data, nota_tecnica = null) => {
//     const client = await pool.connect();

//     try {
//       await client.query('BEGIN');

//       // 1. Obtener estado actual antes de modificar
//       const resOld = await client.query('SELECT estado_actual, asignado_a_tecnico_id FROM tickets WHERE id = $1', [id]);
//       if (resOld.rows.length === 0) {
//         throw new Error('Ticket no encontrado');
//       }
//       const estadoAnterior = resOld.rows[0].estado_actual;

//       const {
//         area_id,
//         categoria_id,
//         asignado_a_tecnico_id,
//         usuario_reporta,
//         email_contacto,
//         titulo,
//         descripcion_problema,
//         prioridad,
//         estado_actual
//       } = data;

//       // 2. Actualizar la tabla tickets
//       const queryUpdate = `
//         UPDATE tickets
//         SET 
//           area_id = $1,
//           categoria_id = $2,
//           asignado_a_tecnico_id = $3,
//           usuario_reporta = $4,
//           email_contacto = $5,
//           titulo = $6,
//           descripcion_problema = $7,
//           prioridad = $8,
//           estado_actual = $9,
//           actualizado_en = CURRENT_TIMESTAMP
//         WHERE id = $10;
//       `;

//       const valuesUpdate = [
//         area_id, 
//         categoria_id, 
//         asignado_a_tecnico_id, 
//         usuario_reporta,
//         email_contacto,
//         titulo, 
//         descripcion_problema, 
//         prioridad, 
//         estado_actual, 
//         id
//       ];

//       await client.query(queryUpdate, valuesUpdate);

//       // 3. Si hubo un cambio de estado, registramos en historial_tickets
//       if (estadoAnterior !== estado_actual) {
//         const queryHistorial = `
//           INSERT INTO historial_tickets (
//             ticket_id, 
//             tecnico_id, 
//             estado_anterior, 
//             estado_nuevo, 
//             nota_tecnica
//           )
//           VALUES ($1, $2, $3, $4, $5);
//         `;
//         const valuesHistorial = [
//           id,
//           asignado_a_tecnico_id || resOld.rows[0].asignado_a_tecnico_id,
//           estadoAnterior,
//           estado_actual,
//           nota_tecnica || `Estado actualizado a ${estado_actual}`
//         ];

//         await client.query(queryHistorial, valuesHistorial);
//       }

//       await client.query('COMMIT');

//       // 4. Retornar el ticket actualizado con los JOINs de nombres
//       const ticketActualizado = await Ticket.getById(id);
//       return ticketActualizado;

//     } catch (error) {
//       await client.query('ROLLBACK');
//       throw error;
//     } finally {
//       client.release();
//     }
//   },

//   // Eliminar ticket
//   delete: async (id) => {
//     const query = 'DELETE FROM tickets WHERE id = $1 RETURNING *;';
//     const { rows } = await pool.query(query, [id]);
//     return rows[0];
//   }
// };

// module.exports = Ticket;



/////////////////////////////////////////////////////
/////////////////////////////////////////////////

// const pool = require('../config/db');

// const Ticket = {
//   // Obtener todos los tickets con nombres de Área, Categoría y Técnico
//   getAll: async () => {
//     const query = `
//       SELECT 
//         t.*,
//         a.nombre AS area_nombre,
//         c.nombre AS categoria_nombre,
//         tec.nombre AS tecnico_nombre
//       FROM tickets t
//       LEFT JOIN areas a ON t.area_id = a.id
//       LEFT JOIN categorias c ON t.categoria_id = c.id
//       LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
//       ORDER BY t.creado_en DESC;
//     `;
//     const { rows } = await pool.query(query);
//     return rows;
//   },

//   // Obtener un ticket por ID
//   getById: async (id) => {
//     const query = `
//       SELECT 
//         t.*,
//         a.nombre AS area_nombre,
//         c.nombre AS categoria_nombre,
//         tec.nombre AS tecnico_nombre
//       FROM tickets t
//       LEFT JOIN areas a ON t.area_id = a.id
//       LEFT JOIN categorias c ON t.categoria_id = c.id
//       LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
//       WHERE t.id = $1;
//     `;
//     const { rows } = await pool.query(query, [id]);
//     return rows[0];
//   },

//   // Crear un nuevo ticket y guardar automáticamente su primer registro en el historial
//   create: async (data) => {
//     const client = await pool.connect();

//     try {
//       await client.query('BEGIN'); // Iniciar transacción

//       const {
//         codigo_ticket,
//         area_id,
//         categoria_id,
//         asignado_a_tecnico_id = null,
//         usuario_reporta,
//         email_contacto = 'sin_correo@ejemplo.com',
//         titulo,
//         descripcion_problema,
//         prioridad = 'MEDIA',
//         estado_actual = 'ABIERTO'
//       } = data;

//       // 1. Insertar en la tabla "tickets"
//       const queryTicket = `
//         INSERT INTO tickets (
//           codigo_ticket, 
//           area_id, 
//           categoria_id, 
//           asignado_a_tecnico_id,
//           usuario_reporta, 
//           email_contacto, 
//           titulo, 
//           descripcion_problema, 
//           prioridad, 
//           estado_actual
//         )
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//         RETURNING *;
//       `;
//       const valuesTicket = [
//         codigo_ticket,
//         area_id,
//         categoria_id,
//         asignado_a_tecnico_id,
//         usuario_reporta,
//         email_contacto,
//         titulo,
//         descripcion_problema,
//         prioridad,
//         estado_actual
//       ];

//       const resTicket = await client.query(queryTicket, valuesTicket);
//       const nuevoTicket = resTicket.rows[0];

//       // 2. Registrar la creación en la tabla "historial_tickets"
//       const queryHistorial = `
//         INSERT INTO historial_tickets (
//           ticket_id, 
//           tecnico_id, 
//           estado_anterior, 
//           estado_nuevo, 
//           nota_tecnica
//         )
//         VALUES ($1, $2, $3, $4, $5);
//       `;
//       const valuesHistorial = [
//         nuevoTicket.id,
//         asignado_a_tecnico_id,
//         'NUEVO',
//         nuevoTicket.estado_actual,
//         descripcion_problema // Se guarda la descripción original del ticket
//       ];

//       await client.query(queryHistorial, valuesHistorial);

//       await client.query('COMMIT');
//       return nuevoTicket;

//     } catch (error) {
//       await client.query('ROLLBACK');
//       throw error;
//     } finally {
//       client.release();
//     }
//   },

//   // Actualizar ticket y registrar historial si cambia de estado
//   update: async (id, data, nota_tecnica = null) => {
//     const client = await pool.connect();

//     try {
//       await client.query('BEGIN');

//       // 1. Obtener estado actual antes de modificar
//       const resOld = await client.query('SELECT estado_actual, asignado_a_tecnico_id FROM tickets WHERE id = $1', [id]);
//       if (resOld.rows.length === 0) {
//         throw new Error('Ticket no encontrado');
//       }
//       const estadoAnterior = resOld.rows[0].estado_actual;

//       const {
//         area_id,
//         categoria_id,
//         asignado_a_tecnico_id,
//         usuario_reporta,
//         email_contacto,
//         titulo,
//         descripcion_problema,
//         prioridad,
//         estado_actual
//       } = data;

//       // 2. Actualizar la tabla tickets
//       const queryUpdate = `
//         UPDATE tickets
//         SET 
//           area_id = $1,
//           categoria_id = $2,
//           asignado_a_tecnico_id = $3,
//           usuario_reporta = $4,
//           email_contacto = $5,
//           titulo = $6,
//           descripcion_problema = $7,
//           prioridad = $8,
//           estado_actual = $9,
//           actualizado_en = CURRENT_TIMESTAMP
//         WHERE id = $10
//         RETURNING *;
//       `;

//       const valuesUpdate = [
//         area_id, 
//         categoria_id, 
//         asignado_a_tecnico_id, 
//         usuario_reporta,
//         email_contacto,
//         titulo, 
//         descripcion_problema, 
//         prioridad, 
//         estado_actual, 
//         id
//       ];

//       const { rows } = await client.query(queryUpdate, valuesUpdate);
//       const ticketActualizado = rows[0];

//       // 3. Si hubo un cambio de estado, registramos en historial_tickets
//       if (estadoAnterior !== estado_actual) {
//         const queryHistorial = `
//           INSERT INTO historial_tickets (
//             ticket_id, 
//             tecnico_id, 
//             estado_anterior, 
//             estado_nuevo, 
//             nota_tecnica
//           )
//           VALUES ($1, $2, $3, $4, $5);
//         `;
//         const valuesHistorial = [
//           id,
//           asignado_a_tecnico_id || resOld.rows[0].asignado_a_tecnico_id,
//           estadoAnterior,
//           estado_actual,
//           nota_tecnica || `Estado actualizado a ${estado_actual}`
//         ];

//         await client.query(queryHistorial, valuesHistorial);
//       }

//       await client.query('COMMIT');
//       return ticketActualizado;

//     } catch (error) {
//       await client.query('ROLLBACK');
//       throw error;
//     } finally {
//       client.release();
//     }
//   },

//   // Eliminar ticket
//   delete: async (id) => {
//     const query = 'DELETE FROM tickets WHERE id = $1 RETURNING *;';
//     const { rows } = await pool.query(query, [id]);
//     return rows[0];
//   }
// };

// module.exports = Ticket;





// const pool = require('../config/db');

// const Ticket = {
//   // Obtener todos los tickets con nombres de Area, Categoria y Técnico
//   getAll: async () => {
//     const query = `
//       SELECT 
//         t.*,
//         a.nombre AS area_nombre,
//         c.nombre AS categoria_nombre,
//         tec.nombre AS tecnico_nombre
//       FROM tickets t
//       LEFT JOIN areas a ON t.area_id = a.id
//       LEFT JOIN categorias c ON t.categoria_id = c.id
//       LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
//       ORDER BY t.creado_en DESC;
//     `;
//     const { rows } = await pool.query(query);
//     return rows;
//   },

//   // Obtener un ticket por ID
//   getById: async (id) => {
//     const query = `
//       SELECT 
//         t.*,
//         a.nombre AS area_nombre,
//         c.nombre AS categoria_nombre,
//         tec.nombre AS tecnico_nombre
//       FROM tickets t
//       LEFT JOIN areas a ON t.area_id = a.id
//       LEFT JOIN categorias c ON t.categoria_id = c.id
//       LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
//       WHERE t.id = $1;
//     `;
//     const { rows } = await pool.query(query, [id]);
//     return rows[0];
//   },

//   // Crear un nuevo ticket
//   create: async (data) => {
//     const {
//       codigo_ticket,
//       area_id,
//       categoria_id,
//       asignado_a_tecnico_id = null,
//       usuario_reporta,
//       email_contacto = 'sin_correo@ejemplo.com',
//       titulo,
//       descripcion_problema,
//       prioridad = 'MEDIA',
//       estado_actual = 'ABIERTO'
//     } = data;

//     const query = `
//       INSERT INTO tickets (
//         codigo_ticket, 
//         area_id, 
//         categoria_id, 
//         asignado_a_tecnico_id,
//         usuario_reporta, 
//         email_contacto, 
//         titulo, 
//         descripcion_problema, 
//         prioridad, 
//         estado_actual
//       )
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//       RETURNING *;
//     `;

//     const values = [
//       codigo_ticket, 
//       area_id, 
//       categoria_id, 
//       asignado_a_tecnico_id,
//       usuario_reporta, 
//       email_contacto, 
//       titulo, 
//       descripcion_problema, 
//       prioridad, 
//       estado_actual
//     ];

//     const { rows } = await pool.query(query, values);
//     return rows[0];
//   },

//   // Actualizar ticket (Estado, Técnico asignado, Prioridad, Email, etc.)
//   update: async (id, data) => {
//     const {
//       area_id,
//       categoria_id,
//       asignado_a_tecnico_id,
//       usuario_reporta,
//       email_contacto,
//       titulo,
//       descripcion_problema,
//       prioridad,
//       estado_actual
//     } = data;

//     const query = `
//       UPDATE tickets
//       SET 
//         area_id = $1,
//         categoria_id = $2,
//         asignado_a_tecnico_id = $3,
//         usuario_reporta = $4,
//         email_contacto = $5,
//         titulo = $6,
//         descripcion_problema = $7,
//         prioridad = $8,
//         estado_actual = $9,
//         actualizado_en = CURRENT_TIMESTAMP
//       WHERE id = $10
//       RETURNING *;
//     `;

//     const values = [
//       area_id, 
//       categoria_id, 
//       asignado_a_tecnico_id, 
//       usuario_reporta,
//       email_contacto,
//       titulo, 
//       descripcion_problema, 
//       prioridad, 
//       estado_actual, 
//       id
//     ];

//     const { rows } = await pool.query(query, values);
//     return rows[0];
//   },

//   // Eliminar ticket
//   delete: async (id) => {
//     const query = 'DELETE FROM tickets WHERE id = $1 RETURNING *;';
//     const { rows } = await pool.query(query, [id]);
//     return rows[0];
//   }
// };

// module.exports = Ticket;



// const pool = require('../config/db');

// const Ticket = {
//   // Obtener todos los tickets con nombres de Area, Categoria y Técnico
//   getAll: async () => {
//     const query = `
//       SELECT 
//         t.*,
//         a.nombre AS area_nombre,
//         c.nombre AS categoria_nombre,
//         tec.nombre AS tecnico_nombre
//       FROM tickets t
//       LEFT JOIN areas a ON t.area_id = a.id
//       LEFT JOIN categorias c ON t.categoria_id = c.id
//       LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
//       ORDER BY t.creado_en DESC;
//     `;
//     const { rows } = await pool.query(query);
//     return rows;
//   },

//   // Obtener un ticket por ID
//   getById: async (id) => {
//     const query = `
//       SELECT 
//         t.*,
//         a.nombre AS area_nombre,
//         c.nombre AS categoria_nombre,
//         tec.nombre AS tecnico_nombre
//       FROM tickets t
//       LEFT JOIN areas a ON t.area_id = a.id
//       LEFT JOIN categorias c ON t.categoria_id = c.id
//       LEFT JOIN tecnicos tec ON t.asignado_a_tecnico_id = tec.id
//       WHERE t.id = $1;
//     `;
//     const { rows } = await pool.query(query, [id]);
//     return rows[0];
//   },

//   // Crear un nuevo ticket
// // Crear un nuevo ticket
// create: async (data) => {
//   const {
//     codigo_ticket,
//     area_id,
//     categoria_id,
//     asignado_a_tecnico_id = null,
//     usuario_reporta,
//     email_contacto, // <-- AGREGAR ESTE CAMPO
//     titulo,
//     descripcion_problema,
//     prioridad = 'MEDIA',
//     estado_actual = 'ABIERTO'
//   } = data;

//   const query = `
//     INSERT INTO tickets (
//       codigo_ticket, area_id, categoria_id, asignado_a_tecnico_id,
//       usuario_reporta, email_contacto, titulo, descripcion_problema, prioridad, estado_actual
//     )
//     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//     RETURNING *;
//   `;

//   const values = [
//     codigo_ticket, area_id, categoria_id, asignado_a_tecnico_id,
//     usuario_reporta, email_contacto, titulo, descripcion_problema, prioridad, estado_actual
//   ];

//   const { rows } = await pool.query(query, values);
//   return rows[0];
// },

//   // Actualizar ticket (Estado, Técnico asignado, Prioridad, etc.)
//   update: async (id, data) => {
//     const {
//       area_id,
//       categoria_id,
//       asignado_a_tecnico_id,
//       usuario_reporta,
//       titulo,
//       descripcion_problema,
//       prioridad,
//       estado_actual
//     } = data;

//     const query = `
//       UPDATE tickets
//       SET 
//         area_id = $1,
//         categoria_id = $2,
//         asignado_a_tecnico_id = $3,
//         usuario_reporta = $4,
//         titulo = $5,
//         descripcion_problema = $6,
//         prioridad = $7,
//         estado_actual = $8,
//         actualizado_en = CURRENT_TIMESTAMP
//       WHERE id = $9
//       RETURNING *;
//     `;

//     const values = [
//       area_id, categoria_id, asignado_a_tecnico_id, usuario_reporta,
//       titulo, descripcion_problema, prioridad, estado_actual, id
//     ];

//     const { rows } = await pool.query(query, values);
//     return rows[0];
//   },

//   // Eliminar ticket
//   delete: async (id) => {
//     const query = 'DELETE FROM tickets WHERE id = $1 RETURNING *;';
//     const { rows } = await pool.query(query, [id]);
//     return rows[0];
//   }
// };

// module.exports = Ticket;