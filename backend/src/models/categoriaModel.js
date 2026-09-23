const pool = require('../config/db');

const Categoria = {
  // Obtener todas las categorías
  getAll: async () => {
    const query = 'SELECT * FROM categorias ORDER BY nombre ASC;';
    const { rows } = await pool.query(query);
    return rows;
  },

  // Crear una nueva categoría
  create: async (nombre) => {
    const query = `
      INSERT INTO categorias (nombre)
      VALUES ($1)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [nombre]);
    return rows[0];
  },

  // Modificar una categoría
  update: async (id, nombre) => {
    const query = `
      UPDATE categorias 
      SET nombre = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [nombre, id]);
    return rows[0];
  },

  // Eliminar una categoría
  delete: async (id) => {
    const query = 'DELETE FROM categorias WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
};

module.exports = Categoria;