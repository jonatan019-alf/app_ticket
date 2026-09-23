const pool = require('../config/db');

const Tecnico = {
  getAll: async () => {
    const query = 'SELECT id, nombre, email, password, activo, es_admin FROM tecnicos ORDER BY nombre ASC;';
    const { rows } = await pool.query(query);
    return rows;
  },

  // Crear con email, password y es_admin
  create: async (data) => {
    const { nombre, email, password, activo = true, es_admin = false } = data;
    const query = `
      INSERT INTO tecnicos (nombre, email, password, activo, es_admin)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, email, password, activo, es_admin;
    `;
    const { rows } = await pool.query(query, [nombre, email, password, activo, es_admin]);
    return rows[0];
  },

  delete: async (id) => {
    const query = 'DELETE FROM tecnicos WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  update: async (id, data) => {
    const { nombre, email, password, activo, es_admin } = data;

    if (password && password.trim() !== '') {
      const query = `
        UPDATE tecnicos 
        SET nombre = $1, email = $2, password = $3, activo = $4, es_admin = $5
        WHERE id = $6
        RETURNING id, nombre, email, password, activo, es_admin;
      `;
      const { rows } = await pool.query(query, [nombre, email, password, activo, es_admin, id]);
      return rows[0];
    } else {
      const query = `
        UPDATE tecnicos 
        SET nombre = $1, email = $2, activo = $3, es_admin = $4
        WHERE id = $5
        RETURNING id, nombre, email, password, activo, es_admin;
      `;
      const { rows } = await pool.query(query, [nombre, email, activo, es_admin, id]);
      return rows[0];
    }
  },
};

module.exports = Tecnico;
