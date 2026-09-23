const pool = require('../config/db');

const Area = {
  // Obtener todas las áreas (SELECT * ya incluye la nueva columna 'correo')
  getAll: async () => {
    const query = 'SELECT * FROM areas ORDER BY nombre ASC;';
    const { rows } = await pool.query(query);
    return rows;
  },

  // Crear una nueva área
  create: async (nombre, correo) => {
    const query = `
      INSERT INTO areas (nombre, correo)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [nombre, correo || null]);
    return rows[0];
  },

  // Modificar un área
  update: async (id, nombre, correo) => {
    const query = `
      UPDATE areas 
      SET nombre = $1, correo = $2
      WHERE id = $3
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [nombre, correo || null, id]);
    return rows[0];
  },

  // Eliminar un área
  delete: async (id) => {
    const query = 'DELETE FROM areas WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
};

module.exports = Area;
